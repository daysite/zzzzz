// Archivo: cmds/antidelete.js

// Almacenamiento de mensajes
if (!global.msgStore) global.msgStore = {}

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
          timestamp: Date.now(),
          text: msg.message.conversation || 
                msg.message.extendedTextMessage?.text || 
                msg.message.imageMessage?.caption ||
                msg.message.videoMessage?.caption ||
                ''
        }
        
        console.log(`[GUARDADO] ${chatId} - ${msgId.substring(0, 10)}...`)
        
        // Eliminar después de 2 minutos
        setTimeout(() => {
          delete global.msgStore[chatId]?.[msgId]
        }, 120000)
      }
      
    } catch (error) {
      console.error('[SAVE ERROR]', error.message)
    }
  },
  
  // Detectar mensajes eliminados
  checkDelete: async (sock, msg) => {
    try {
      // Detectar protocolMessage (mensajes eliminados)
      if (msg.message?.protocolMessage) {
        const protocolMsg = msg.message.protocolMessage
        
        console.log(`[PROTOCOL] Tipo: ${protocolMsg.type}`)
        
        // type 0: REVOKE (mensaje eliminado)
        if (protocolMsg.type === 0) {
          const deletedKey = protocolMsg.key
          const chatId = deletedKey.remoteJid
          const deletedMsgId = deletedKey.id
          
          console.log(`[ELIMINADO!] Chat: ${chatId}, ID: ${deletedMsgId}`)
          
          const deletedMsg = global.msgStore[chatId]?.[deletedMsgId]
          
          if (deletedMsg) {
            console.log(`[RECUPERADO] Mensaje encontrado!`)
            await this.resendMessage(sock, chatId, deletedMsg, msg)
          } else {
            console.log(`[NO ENCONTRADO] Mensaje no está en store (puede que ya pasaron 2 minutos o no se guardó)`)
          }
        }
      }
      
    } catch (error) {
      console.error('[DELETE CHECK ERROR]', error.message)
    }
  },
  
  // Reenviar mensaje recuperado
  resendMessage: async (sock, chatId, deletedMsg, originalMsg) => {
    try {
      const deleter = originalMsg.key?.participant || originalMsg.key?.remoteJid || 'Alguien'
      const author = deletedMsg.key?.participant || deletedMsg.key?.remoteJid
      
      let content = deletedMsg.text || ''
      let type = 'texto'
      let mediaBuffer = null
      
      const msgObj = deletedMsg.message
      
      // Detectar tipo de mensaje
      if (msgObj?.imageMessage) {
        type = 'imagen'
        content = msgObj.imageMessage.caption || 'Sin descripción'
        try {
          mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        } catch(e) { console.log('Error imagen:', e.message) }
      }
      else if (msgObj?.videoMessage) {
        type = 'video'
        content = msgObj.videoMessage.caption || 'Sin descripción'
        try {
          mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        } catch(e) { console.log('Error video:', e.message) }
      }
      else if (msgObj?.stickerMessage) {
        type = 'sticker'
        try {
          mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        } catch(e) { console.log('Error sticker:', e.message) }
      }
      else if (msgObj?.audioMessage) {
        type = 'audio'
        try {
          mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        } catch(e) { console.log('Error audio:', e.message) }
      }
      else if (msgObj?.conversation) {
        content = msgObj.conversation
      }
      else if (msgObj?.extendedTextMessage?.text) {
        content = msgObj.extendedTextMessage.text
      }
      
      const nombreAutor = author?.split('@')[0] || 'Desconocido'
      const nombreDeleter = deleter?.split('@')[0] || 'Alguien'
      
      const notificacion = `🔴 *MENSAJE ELIMINADO*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}
${content ? `💬 *Contenido:*\n${content.substring(0, 300)}` : ''}

🛡️ *Anti-Delete*`
      
      // Reenviar
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
        await sock.sendMessage(chatId, { audio: mediaBuffer, mimetype: 'audio/mp4' })
        await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
      }
      else {
        await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
      }
      
      console.log(`[REENVIADO] ✅ Mensaje de ${nombreAutor} eliminado por ${nombreDeleter}`)
      
    } catch (error) {
      console.error('[RESEND ERROR]', error.message)
    }
  }
}
