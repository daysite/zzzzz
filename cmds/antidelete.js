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
      
      // Solo guardar mensajes normales (no protocolMessages)
      if (msg.message && !msg.message?.protocolMessage) {
        
        if (!global.msgStore[chatId]) {
          global.msgStore[chatId] = {}
        }
        
        // Guardar mensaje completo
        global.msgStore[chatId][msgId] = {
          key: msg.key,
          message: JSON.parse(JSON.stringify(msg.message)),
          timestamp: Date.now()
        }
        
        console.log(`[SAVE] Mensaje guardado: ${chatId} - ${msgId}`)
        
        // Eliminar después de 2 minutos (tiempo suficiente para detectar eliminación)
        setTimeout(() => {
          delete global.msgStore[chatId]?.[msgId]
          console.log(`[DELETE] Mensaje eliminado del store: ${msgId}`)
        }, 120000) // 2 minutos
      }
      
    } catch (error) {
      console.error('[SAVE ERROR]', error.message)
    }
  },
  
  // Detectar y reenviar mensajes eliminados
  checkDelete: async (sock, msg) => {
    try {
      // Detectar si es un mensaje eliminado (protocolMessage type 1 = revoke)
      if (msg.message?.protocolMessage?.type === 1) {
        
        const protocolMsg = msg.message.protocolMessage
        const deletedKey = protocolMsg.key
        const chatId = deletedKey.remoteJid
        const deletedMsgId = deletedKey.id
        
        console.log(`[DELETE DETECTED] Mensaje eliminado en ${chatId}, ID: ${deletedMsgId}`)
        
        // Buscar el mensaje en el store
        const deletedMsg = global.msgStore[chatId]?.[deletedMsgId]
        
        if (!deletedMsg) {
          console.log(`[NOT FOUND] No se encontró el mensaje: ${deletedMsgId}`)
          return
        }
        
        console.log(`[FOUND] Mensaje encontrado en store, recuperando...`)
        
        // Información de quién eliminó y quién escribió
        const deleter = msg.key?.participant || msg.key?.remoteJid || 'Alguien'
        const author = deletedMsg.key?.participant || deletedMsg.key?.remoteJid
        
        // Extraer contenido según tipo
        let content = ''
        let type = 'texto'
        let mediaBuffer = null
        
        const msgObj = deletedMsg.message
        
        // === TEXTO NORMAL ===
        if (msgObj?.conversation) {
          content = msgObj.conversation
          type = 'texto'
        }
        // === TEXTO CON FORMATO ===
        else if (msgObj?.extendedTextMessage?.text) {
          content = msgObj.extendedTextMessage.text
          type = 'texto'
        }
        // === IMAGEN ===
        else if (msgObj?.imageMessage) {
          content = msgObj.imageMessage.caption || 'Sin descripción'
          type = 'imagen'
          try {
            const fakeMsg = {
              key: deletedMsg.key,
              message: msgObj
            }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch (e) {
            console.log('[ERROR] Error descargando imagen:', e.message)
          }
        }
        // === VIDEO ===
        else if (msgObj?.videoMessage) {
          content = msgObj.videoMessage.caption || 'Sin descripción'
          type = 'video'
          try {
            const fakeMsg = {
              key: deletedMsg.key,
              message: msgObj
            }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch (e) {
            console.log('[ERROR] Error descargando video:', e.message)
          }
        }
        // === STICKER ===
        else if (msgObj?.stickerMessage) {
          type = 'sticker'
          try {
            const fakeMsg = {
              key: deletedMsg.key,
              message: msgObj
            }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch (e) {
            console.log('[ERROR] Error descargando sticker:', e.message)
          }
        }
        // === AUDIO ===
        else if (msgObj?.audioMessage) {
          type = 'audio'
          try {
            const fakeMsg = {
              key: deletedMsg.key,
              message: msgObj
            }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch (e) {
            console.log('[ERROR] Error descargando audio:', e.message)
          }
        }
        // === DOCUMENTO ===
        else if (msgObj?.documentMessage) {
          content = msgObj.documentMessage.fileName || 'Documento'
          type = 'documento'
          try {
            const fakeMsg = {
              key: deletedMsg.key,
              message: msgObj
            }
            mediaBuffer = await sock.downloadMediaMessage(fakeMsg)
          } catch (e) {
            console.log('[ERROR] Error descargando documento:', e.message)
          }
        }
        // === CONTACTO ===
        else if (msgObj?.contactMessage) {
          const contact = msgObj.contactMessage
          content = `Nombre: ${contact.displayName || 'Sin nombre'}`
          type = 'contacto'
        }
        // === UBICACIÓN ===
        else if (msgObj?.locationMessage) {
          const loc = msgObj.locationMessage
          content = `Lat: ${loc.degreesLatitude}, Lng: ${loc.degreesLongitude}`
          type = 'ubicación'
        }
        // === OTROS ===
        else {
          content = 'Tipo de mensaje no soportado'
          type = 'desconocido'
        }
        
        // Formatear nombres
        const nombreAutor = author?.split('@')[0] || 'Desconocido'
        const nombreDeleter = deleter?.split('@')[0] || 'Alguien'
        
        // Mensaje de notificación
        const notificacion = `🔴 *MENSAJE ELIMINADO*

👤 *Autor:* @${nombreAutor}
🗑️ *Eliminado por:* @${nombreDeleter}
📝 *Tipo:* ${type}
${content ? `💬 *Contenido:*\n${content.substring(0, 300)}` : ''}

⏰ *Hora:* ${new Date().toLocaleString()}

🛡️ *Anti-Delete Automático*`
        
        // === REENVIAR SEGÚN EL TIPO ===
        
        // Sticker
        if (type === 'sticker' && mediaBuffer) {
          await sock.sendMessage(chatId, { sticker: mediaBuffer })
          await sock.sendMessage(chatId, { 
            text: notificacion, 
            mentions: [author, deleter] 
          })
        }
        // Imagen
        else if (type === 'imagen' && mediaBuffer) {
          await sock.sendMessage(chatId, { 
            image: mediaBuffer, 
            caption: notificacion,
            mentions: [author, deleter]
          })
        }
        // Video
        else if (type === 'video' && mediaBuffer) {
          await sock.sendMessage(chatId, { 
            video: mediaBuffer, 
            caption: notificacion,
            mentions: [author, deleter]
          })
        }
        // Audio
        else if (type === 'audio' && mediaBuffer) {
          await sock.sendMessage(chatId, { 
            audio: mediaBuffer, 
            mimetype: 'audio/mp4'
          })
          await sock.sendMessage(chatId, { 
            text: notificacion, 
            mentions: [author, deleter] 
          })
        }
        // Documento
        else if (type === 'documento' && mediaBuffer) {
          await sock.sendMessage(chatId, { 
            document: mediaBuffer,
            fileName: content,
            caption: notificacion,
            mentions: [author, deleter]
          })
        }
        // Texto, contacto, ubicación o desconocido
        else {
          await sock.sendMessage(chatId, { 
            text: notificacion, 
            mentions: [author, deleter] 
          })
        }
        
        console.log(`[REENVIADO] Mensaje de @${nombreAutor} eliminado por @${nombreDeleter} en ${chatId}`)
      }
      
    } catch (error) {
      console.error('[DELETE CHECK ERROR]', error.message)
    }
  }
}
