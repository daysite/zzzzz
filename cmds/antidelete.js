// Archivo: cmds/antidelete.js

// Almacenamiento de mensajes
if (!global.msgStore) global.msgStore = {}

// Función para reenviar mensajes
async function resendMessage(sock, chatId, deletedMsg, originalMsg) {
  try {
    const deleter = originalMsg.key?.participant || originalMsg.key?.remoteJid || 'Alguien'
    const author = deletedMsg.key?.participant || deletedMsg.key?.remoteJid
    
    let content = ''
    let type = 'texto'
    let mediaBuffer = null
    
    const msgObj = deletedMsg.message
    
    // Detectar tipo de mensaje y extraer contenido
    if (msgObj?.imageMessage) {
      type = 'imagen'
      content = msgObj.imageMessage.caption || ''
      try {
        mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
      } catch(e) { console.log('Error imagen:', e.message) }
    }
    else if (msgObj?.videoMessage) {
      type = 'video'
      content = msgObj.videoMessage.caption || ''
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
      type = 'texto'
    }
    else if (msgObj?.extendedTextMessage?.text) {
      content = msgObj.extendedTextMessage.text
      type = 'texto'
    }
    else if (msgObj?.documentMessage) {
      content = msgObj.documentMessage.fileName || 'Documento'
      type = 'documento'
      try {
        mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
      } catch(e) { console.log('Error documento:', e.message) }
    }
    
    const nombreAutor = author?.split('@')[0] || 'Desconocido'
    const nombreDeleter = deleter?.split('@')[0] || 'Alguien'
    
    // Formato simplificado que pediste
    const notificacion = `🔴 *MENSAJE ELIMINADO*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}

🛡️ *Anti-Delete*`
    
    // === REENVIAR PRIMERO EL CONTENIDO DEL MENSAJE ===
    
    // Si es sticker
    if (type === 'sticker' && mediaBuffer) {
      await sock.sendMessage(chatId, { sticker: mediaBuffer })
    }
    // Si es imagen
    else if (type === 'imagen' && mediaBuffer) {
      await sock.sendMessage(chatId, { image: mediaBuffer, caption: content || '' })
    }
    // Si es video
    else if (type === 'video' && mediaBuffer) {
      await sock.sendMessage(chatId, { video: mediaBuffer, caption: content || '' })
    }
    // Si es audio
    else if (type === 'audio' && mediaBuffer) {
      await sock.sendMessage(chatId, { audio: mediaBuffer, mimetype: 'audio/mp4' })
    }
    // Si es documento
    else if (type === 'documento' && mediaBuffer) {
      await sock.sendMessage(chatId, { document: mediaBuffer, fileName: content })
    }
    // Si es texto o tiene contenido
    else if (content && content.trim() !== '') {
      await sock.sendMessage(chatId, { text: content })
    }
    
    // === LUEGO ENVIAR LA NOTIFICACIÓN ===
    await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
    
    console.log(`[REENVIADO] Mensaje de ${nombreAutor} reenviado correctamente`)
    
  } catch (error) {
    console.error('[RESEND ERROR]', error.message)
  }
}

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
        
        // Guardar el mensaje completo
        global.msgStore[chatId][msgId] = {
          key: msg.key,
          message: JSON.parse(JSON.stringify(msg.message)),
          timestamp: Date.now()
        }
        
        console.log(`[GUARDADO] ${chatId.substring(0, 15)}... - ${msgId.substring(0, 10)}...`)
        
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
        
        // type 0: REVOKE (mensaje eliminado)
        if (protocolMsg.type === 0 || protocolMsg.type === 'REVOKE') {
          const deletedKey = protocolMsg.key
          const chatId = deletedKey.remoteJid
          const deletedMsgId = deletedKey.id
          
          console.log(`[ELIMINADO] ID: ${deletedMsgId.substring(0, 15)}...`)
          
          const deletedMsg = global.msgStore[chatId]?.[deletedMsgId]
          
          if (deletedMsg) {
            console.log(`[ENCONTRADO] Reenviando...`)
            await resendMessage(sock, chatId, deletedMsg, msg)
          } else {
            console.log(`[NO ENCONTRADO] Mensaje no está en store`)
          }
        }
      }
      
    } catch (error) {
      console.error('[DELETE CHECK ERROR]', error.message)
    }
  }
}
