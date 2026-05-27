// Archivo: cmds/antidelete.js

// Almacenamiento de mensajes
if (!global.msgStore) global.msgStore = {}
if (!global.processedDeletes) global.processedDeletes = new Set()

export default {
  // Este método se llama automáticamente desde el handler
  onDelete: async (sock, msg) => {
    try {
      // Detectar mensaje eliminado
      if (msg.message?.protocolMessage && 
          msg.message.protocolMessage.type === 1) {
        
        const protocolMsg = msg.message.protocolMessage
        const deletedKey = protocolMsg.key
        const chatId = deletedKey.remoteJid
        const deletedMsgId = deletedKey.id
        
        // Evitar duplicados
        const deleteKey = `${chatId}_${deletedMsgId}`
        if (global.processedDeletes.has(deleteKey)) return
        global.processedDeletes.add(deleteKey)
        setTimeout(() => global.processedDeletes.delete(deleteKey), 5000)
        
        // Buscar mensaje original
        const deletedMsg = global.msgStore[chatId]?.[deletedMsgId]
        if (!deletedMsg) return
        
        const deleter = msg.participant || msg.key?.participant || 'Alguien'
        const author = deletedMsg.key?.participant || deletedMsg.key?.remoteJid
        
        // Extraer contenido
        let content = ''
        let type = 'texto'
        let mediaBuffer = null
        
        const msgObj = deletedMsg.message
        
        if (msgObj?.conversation) {
          content = msgObj.conversation
        }
        else if (msgObj?.extendedTextMessage?.text) {
          content = msgObj.extendedTextMessage.text
        }
        else if (msgObj?.imageMessage) {
          content = msgObj.imageMessage.caption || 'Sin texto'
          type = 'imagen'
          try { mediaBuffer = await sock.downloadMediaMessage(deletedMsg) } catch(e) {}
        }
        else if (msgObj?.videoMessage) {
          content = msgObj.videoMessage.caption || 'Sin texto'
          type = 'video'
          try { mediaBuffer = await sock.downloadMediaMessage(deletedMsg) } catch(e) {}
        }
        else if (msgObj?.stickerMessage) {
          type = 'sticker'
          try { mediaBuffer = await sock.downloadMediaMessage(deletedMsg) } catch(e) {}
        }
        else if (msgObj?.audioMessage) {
          type = 'audio'
          try { mediaBuffer = await sock.downloadMediaMessage(deletedMsg) } catch(e) {}
        }
        else {
          content = 'Contenido no compatible'
        }
        
        const nombreAutor = author?.split('@')[0] || 'Desconocido'
        const nombreDeleter = deleter.split('@')[0]
        
        const notificacion = `🔴 *Mensaje Eliminado*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}
${content ? `💬 *Texto:* ${content.substring(0, 200)}` : ''}

🛡️ *Anti-Delete Automático*`
        
        // Reenviar según tipo
        if (type === 'sticker' && mediaBuffer) {
          await sock.sendMessage(chatId, { sticker: mediaBuffer })
          await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
        }
        else if (type === 'imagen' && mediaBuffer) {
          await sock.sendMessage(chatId, { image: mediaBuffer, caption: notificacion, mentions: [author, deleter] })
        }
        else if (type === 'video' && mediaBuffer) {
          await sock.sendMessage(chatId, { video: mediaBuffer, caption: notificacion, mentions: [author, deleter] })
        }
        else if (type === 'audio' && mediaBuffer) {
          await sock.sendMessage(chatId, { audio: mediaBuffer, mimetype: 'audio/opus' })
          await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
        }
        else {
          await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
        }
        
        console.log(`[ANTIDELETE] Reenviado: ${nombreAutor} -> ${nombreDeleter}`)
      }
      
      // Guardar mensajes normales (solo por 5 minutos)
      if (msg.key && msg.message && !msg.message?.protocolMessage) {
        const chatId = msg.key.remoteJid
        const msgId = msg.key.id
        
        if (!global.msgStore[chatId]) global.msgStore[chatId] = {}
        
        global.msgStore[chatId][msgId] = {
          key: msg.key,
          message: msg.message,
          timestamp: Date.now()
        }
        
        // Auto-limpiar después de 5 minutos
        setTimeout(() => {
          delete global.msgStore[chatId]?.[msgId]
        }, 300000)
      }
      
    } catch (error) {
      console.error('[ANTIDELETE]', error.message)
    }
  }
}
