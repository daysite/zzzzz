// Archivo: cmds/antidelete.js

// Almacenamiento de mensajes
if (!global.msgStore) global.msgStore = {}

// Función para reenviar mensajes (fuera del objeto)
async function resendMessage(sock, chatId, deletedMsg, originalMsg) {
  try {
    const deleter = originalMsg.key?.participant || originalMsg.key?.remoteJid || 'Alguien'
    const author = deletedMsg.key?.participant || deletedMsg.key?.remoteJid
    
    let content = ''
    let type = 'texto'
    let mediaBuffer = null
    
    const msgObj = deletedMsg.message
    
    console.log(`[REENVIANDO] Tipo de mensaje:`, msgObj ? Object.keys(msgObj)[0] : 'desconocido')
    
    // Detectar tipo de mensaje
    if (msgObj?.imageMessage) {
      type = 'imagen'
      content = msgObj.imageMessage.caption || 'Sin descripción'
      try {
        mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        console.log(`[IMAGEN] Descargada, tamaño: ${mediaBuffer.length} bytes`)
      } catch(e) { console.log('Error imagen:', e.message) }
    }
    else if (msgObj?.videoMessage) {
      type = 'video'
      content = msgObj.videoMessage.caption || 'Sin descripción'
      try {
        mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        console.log(`[VIDEO] Descargado, tamaño: ${mediaBuffer.length} bytes`)
      } catch(e) { console.log('Error video:', e.message) }
    }
    else if (msgObj?.stickerMessage) {
      type = 'sticker'
      try {
        mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        console.log(`[STICKER] Descargado, tamaño: ${mediaBuffer.length} bytes`)
      } catch(e) { console.log('Error sticker:', e.message) }
    }
    else if (msgObj?.audioMessage) {
      type = 'audio'
      try {
        mediaBuffer = await sock.downloadMediaMessage({ key: deletedMsg.key, message: msgObj })
        console.log(`[AUDIO] Descargado, tamaño: ${mediaBuffer.length} bytes`)
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
    else {
      content = 'Mensaje no soportado para reenviar'
      type = 'desconocido'
    }
    
    const nombreAutor = author?.split('@')[0] || 'Desconocido'
    const nombreDeleter = deleter?.split('@')[0] || 'Alguien'
    
    const notificacion = `🔴 *MENSAJE ELIMINADO*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}
${content ? `💬 *Contenido:*\n${content.substring(0, 300)}` : ''}

🛡️ *Anti-Delete*`
    
    // Reenviar según el tipo
    if (type === 'sticker' && mediaBuffer) {
      await sock.sendMessage(chatId, { sticker: mediaBuffer })
      await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
      console.log(`[REENVIADO] Sticker reenviado`)
    }
    else if (type === 'imagen' && mediaBuffer) {
      await sock.sendMessage(chatId, { image: mediaBuffer, caption: notificacion, mentions: [author, deleter] })
      console.log(`[REENVIADO] Imagen reenviada`)
    }
    else if (type === 'video' && mediaBuffer) {
      await sock.sendMessage(chatId, { video: mediaBuffer, caption: notificacion, mentions: [author, deleter] })
      console.log(`[REENVIADO] Video reenviado`)
    }
    else if (type === 'audio' && mediaBuffer) {
      await sock.sendMessage(chatId, { audio: mediaBuffer, mimetype: 'audio/mp4' })
      await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
      console.log(`[REENVIADO] Audio reenviado`)
    }
    else if (type === 'documento' && mediaBuffer) {
      await sock.sendMessage(chatId, { document: mediaBuffer, fileName: content, caption: notificacion, mentions: [author, deleter] })
      console.log(`[REENVIADO] Documento reenviado`)
    }
    else {
      await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
      console.log(`[REENVIADO] Texto reenviado`)
    }
    
    return true
    
  } catch (error) {
    console.error('[RESEND ERROR]', error.message)
    return false
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
        
        console.log(`[GUARDADO] ${chatId.substring(0, 15)}... - ${msgId.substring(0, 10)}...`)
        
        // Eliminar después de 2 minutos
        setTimeout(() => {
          delete global.msgStore[chatId]?.[msgId]
          console.log(`[ELIMINADO STORE] ${msgId.substring(0, 10)}...`)
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
          
          console.log(`[ELIMINADO DETECTADO] ID: ${deletedMsgId.substring(0, 15)}...`)
          
          const deletedMsg = global.msgStore[chatId]?.[deletedMsgId]
          
          if (deletedMsg) {
            console.log(`[ENCONTRADO] Recuperando mensaje...`)
            // Llamar a la función externa
            await resendMessage(sock, chatId, deletedMsg, msg)
          } else {
            console.log(`[NO ENCONTRADO] El mensaje no está en el store (puede que haya pasado más de 2 minutos)`)
          }
        }
      }
      
    } catch (error) {
      console.error('[DELETE CHECK ERROR]', error.message)
    }
  }
}
