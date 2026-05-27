// Archivo: cmds/antidelete.js

// Almacenamiento de mensajes
if (!global.msgStore) global.msgStore = {}
if (!global.processedDeletes) global.processedDeletes = new Set()

export default {
  // Guardar mensajes
  saveMessage: async (sock, msg) => {
    try {
      const chatId = msg.key?.remoteJid
      const msgId = msg.key?.id
      
      if (!chatId || !msgId) return
      
      // Solo guardar mensajes normales
      if (msg.message && !msg.message?.protocolMessage) {
        
        if (!global.msgStore[chatId]) {
          global.msgStore[chatId] = {}
        }
        
        global.msgStore[chatId][msgId] = {
          key: msg.key,
          message: JSON.parse(JSON.stringify(msg.message)),
          timestamp: Date.now()
        }
        
        // Eliminar después de 2 minutos
        setTimeout(() => {
          delete global.msgStore[chatId]?.[msgId]
        }, 120000)
      }
      
    } catch (error) {
      console.error('[SAVE ERROR]', error.message)
    }
  },
  
  // Detectar y reenviar mensajes eliminados
  checkDelete: async (sock, msg) => {
    try {
      // Detectar mensaje eliminado
      if (msg.message?.protocolMessage?.type === 1) {
        
        const protocolMsg = msg.message.protocolMessage
        const deletedKey = protocolMsg.key
        const chatId = deletedKey.remoteJid
        const deletedMsgId = deletedKey.id
        
        const deletedMsg = global.msgStore[chatId]?.[deletedMsgId]
        
        if (!deletedMsg) return
        
        const deleter = msg.key?.participant || msg.key?.remoteJid || 'Alguien'
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
          try {
            const fakeMsg = { key: deletedMsg.key, message: msgObj }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch(e) {}
        }
        else if (msgObj?.videoMessage) {
          content = msgObj.videoMessage.caption || 'Sin texto'
          type = 'video'
          try {
            const fakeMsg = { key: deletedMsg.key, message: msgObj }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch(e) {}
        }
        else if (msgObj?.stickerMessage) {
          type = 'sticker'
          try {
            const fakeMsg = { key: deletedMsg.key, message: msgObj }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch(e) {}
        }
        else {
          content = 'Contenido no compatible'
        }
        
        const nombreAutor = author?.split('@')[0] || 'Desconocido'
        const nombreDeleter = deleter?.split('@')[0] || 'Alguien'
        
        const notificacion = `🔴 *Mensaje Eliminado*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}
${content ? `💬 *Texto:* ${content.substring(0, 200)}` : ''}

🛡️ *Anti-Delete*`
        
        // Reenviar
        if (type === 'sticker' && mediaBuffer) {
          await sock.sendMessage(chatId, { sticker: mediaBuffer })
          await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
        }
        else if ((type === 'imagen' || type === 'video') && mediaBuffer) {
          const sendFunc = type === 'imagen' ? 'image' : 'video'
          await sock.sendMessage(chatId, {
            [sendFunc]: mediaBuffer,
            caption: notificacion,
            mentions: [author, deleter]
          })
        }
        else {
          await sock.sendMessage(chatId, {
            text: notificacion,
            mentions: [author, deleter]
          })
        }
        
        console.log(`[ANTIDELETE] Reenviado: ${nombreAutor} -> ${nombreDeleter}`)
      }
      
    } catch (error) {
      console.error('[DELETE ERROR]', error.message)
    }
  }
}
