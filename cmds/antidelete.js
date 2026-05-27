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
    
    console.log(`[TIPO MENSAJE] ${Object.keys(msgObj || {})[0]}`)
    
    // Detectar tipo de mensaje
    try {
      // === STICKER ===
      if (msgObj?.stickerMessage) {
        type = 'sticker'
        const stickerMsg = msgObj.stickerMessage
        
        // Verificar si tiene URL directa
        if (stickerMsg?.url) {
          console.log(`[STICKER] Descargando desde URL: ${stickerMsg.url.substring(0, 50)}...`)
          const response = await fetch(stickerMsg.url)
          if (response.ok) {
            mediaBuffer = Buffer.from(await response.arrayBuffer())
            console.log(`[STICKER] Descargado desde URL, tamaño: ${mediaBuffer.length} bytes`)
          }
        }
        // Si no tiene URL, intentar con downloadMediaMessage
        else if (deletedMsg.key && msgObj) {
          try {
            mediaBuffer = await sock.downloadMediaMessage(deletedMsg)
            console.log(`[STICKER] Descargado con downloadMediaMessage, tamaño: ${mediaBuffer?.length || 0} bytes`)
          } catch (e) {
            console.log(`[STICKER] Error downloadMediaMessage: ${e.message}`)
          }
        }
        
        // Si no se pudo descargar, enviar aviso
        if (!mediaBuffer) {
          content = '[No se pudo recuperar el sticker]'
          type = 'texto'
        }
      }
      // === IMAGEN ===
      else if (msgObj?.imageMessage) {
        type = 'imagen'
        content = msgObj.imageMessage.caption || ''
        try {
          mediaBuffer = await sock.downloadMediaMessage(deletedMsg)
          console.log(`[IMAGEN] Descargada, tamaño: ${mediaBuffer?.length || 0} bytes`)
        } catch(e) { 
          console.log(`[IMAGEN] Error: ${e.message}`)
          // Intentar con URL directa si existe
          if (msgObj.imageMessage?.url) {
            const response = await fetch(msgObj.imageMessage.url)
            if (response.ok) mediaBuffer = Buffer.from(await response.arrayBuffer())
          }
        }
      }
      // === VIDEO ===
      else if (msgObj?.videoMessage) {
        type = 'video'
        content = msgObj.videoMessage.caption || ''
        try {
          mediaBuffer = await sock.downloadMediaMessage(deletedMsg)
          console.log(`[VIDEO] Descargado, tamaño: ${mediaBuffer?.length || 0} bytes`)
        } catch(e) { console.log(`[VIDEO] Error: ${e.message}`) }
      }
      // === AUDIO ===
      else if (msgObj?.audioMessage) {
        type = 'audio'
        try {
          mediaBuffer = await sock.downloadMediaMessage(deletedMsg)
          console.log(`[AUDIO] Descargado, tamaño: ${mediaBuffer?.length || 0} bytes`)
        } catch(e) { console.log(`[AUDIO] Error: ${e.message}`) }
      }
      // === TEXTO NORMAL ===
      else if (msgObj?.conversation) {
        content = msgObj.conversation
        type = 'texto'
      }
      // === TEXTO CON FORMATO ===
      else if (msgObj?.extendedTextMessage?.text) {
        content = msgObj.extendedTextMessage.text
        type = 'texto'
      }
      // === DOCUMENTO ===
      else if (msgObj?.documentMessage) {
        content = msgObj.documentMessage.fileName || 'Documento'
        type = 'documento'
        try {
          mediaBuffer = await sock.downloadMediaMessage(deletedMsg)
        } catch(e) { console.log(`[DOCUMENTO] Error: ${e.message}`) }
      }
    } catch (err) {
      console.log(`[ERROR MEDIA] ${err.message}`)
    }
    
    const nombreAutor = author?.split('@')[0] || 'Desconocido'
    const nombreDeleter = deleter?.split('@')[0] || 'Alguien'
    
    // Notificación simplificada
    const notificacion = `🔴 *MENSAJE ELIMINADO*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}

🛡️ *Anti-Delete*`
    
    // === REENVIAR EL CONTENIDO ===
    if (type === 'sticker' && mediaBuffer) {
      try {
        await sock.sendMessage(chatId, { sticker: mediaBuffer })
        console.log(`[STICKER REENVIADO]`)
      } catch(e) {
        console.log(`[ERROR] No se pudo reenviar sticker: ${e.message}`)
        await sock.sendMessage(chatId, { text: `[Sticker no recuperable]` })
      }
    }
    else if (type === 'imagen' && mediaBuffer) {
      await sock.sendMessage(chatId, { image: mediaBuffer, caption: content || '' })
    }
    else if (type === 'video' && mediaBuffer) {
      await sock.sendMessage(chatId, { video: mediaBuffer, caption: content || '' })
    }
    else if (type === 'audio' && mediaBuffer) {
      await sock.sendMessage(chatId, { audio: mediaBuffer, mimetype: 'audio/mp4' })
    }
    else if (type === 'documento' && mediaBuffer) {
      await sock.sendMessage(chatId, { document: mediaBuffer, fileName: content })
    }
    else if (content && content.trim() !== '') {
      await sock.sendMessage(chatId, { text: content })
    }
    
    // === ENVIAR NOTIFICACIÓN ===
    await sock.sendMessage(chatId, { text: notificacion, mentions: [author, deleter] })
    
    console.log(`[REENVIADO] Mensaje de @${nombreAutor} reenviado correctamente`)
    
  } catch (error) {
    console.error('[RESEND ERROR]', error.message)
    // En caso de error, al menos enviar la notificación
    try {
      const author = deletedMsg?.key?.participant || deletedMsg?.key?.remoteJid || 'Desconocido'
      const deleter = originalMsg?.key?.participant || originalMsg?.key?.remoteJid || 'Alguien'
      const notificacionError = `🔴 *MENSAJE ELIMINADO*

👤 *Autor:* @${author?.split('@')[0]}
🗑️ *Eliminado por:* @${deleter?.split('@')[0]}
📝 *Tipo:* No recuperable

🛡️ *Anti-Delete*`
      await sock.sendMessage(chatId, { text: notificacionError, mentions: [author, deleter] })
    } catch(e) {}
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
