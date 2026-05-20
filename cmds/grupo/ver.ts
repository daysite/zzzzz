import fetch from 'node-fetch'

export default {
  command: ['reveal', 'viewonce', 'ver'],
  category: 'tools',

  run: async (sock, m, args) => {
    try {
      // Verificar que se está respondiendo a un mensaje
      if (!m.quoted) {
        return m.reply(
          '《✧》 Responde al mensaje de "Ver una sola vez" que quieres revelar.\n\nEjemplo: Responde a la foto/video con .reveal'
        )
      }

      const quoted = m.quoted
      
      // === MÚLTIPLES MÉTODOS PARA DETECTAR VIEW ONCE ===
      let isViewOnce = false
      let mediaContent = null
      
      // MÉTODO 1: Detección directa en el objeto quoted
      if (quoted.viewOnce === true || quoted.isViewOnce === true) {
        isViewOnce = true
        console.log('✅ Detectado por viewOnce flag')
      }
      
      // MÉTODO 2: Verificar si el mensaje tiene la estructura viewOnceMessage
      if (quoted.message) {
        const msg = quoted.message
        
        if (msg.viewOnceMessageV2) {
          isViewOnce = true
          mediaContent = msg.viewOnceMessageV2.message
          console.log('✅ Detectado por viewOnceMessageV2')
        }
        else if (msg.viewOnceMessage) {
          isViewOnce = true
          mediaContent = msg.viewOnceMessage.message
          console.log('✅ Detectado por viewOnceMessage')
        }
        else if (msg.ephemeralMessage?.message?.viewOnceMessageV2) {
          isViewOnce = true
          mediaContent = msg.ephemeralMessage.message.viewOnceMessageV2.message
          console.log('✅ Detectado por ephemeralMessage + viewOnceMessageV2')
        }
      }
      
      // MÉTODO 3: Verificar en la estructura de mensaje respondido directamente
      if (quoted.msg && !isViewOnce) {
        const msgObj = quoted.msg
        
        if (msgObj.viewOnceMessageV2 || msgObj.viewOnceMessage) {
          isViewOnce = true
          mediaContent = msgObj.viewOnceMessageV2?.message || msgObj.viewOnceMessage?.message
          console.log('✅ Detectado por quoted.msg')
        }
      }
      
      // MÉTODO 4: Verificar por el tipo de mensaje y si tiene URL
      if (!isViewOnce && quoted.url) {
        // Intentar detectar si es viewOnce por el contexto
        console.log('⚠️ Mensaje con URL pero sin flag viewOnce - puede ser viewOnce no detectado')
        
        // Mostrar info de depuración
        console.log('Estructura del mensaje:', JSON.stringify(quoted, null, 2).substring(0, 500))
      }
      
      // Si no se detectó como viewOnce, mostrar información de depuración
      if (!isViewOnce) {
        // Mostrar estructura para depurar
        const estructuraInfo = []
        
        if (quoted.viewOnce !== undefined) estructuraInfo.push(`viewOnce: ${quoted.viewOnce}`)
        if (quoted.isViewOnce !== undefined) estructuraInfo.push(`isViewOnce: ${quoted.isViewOnce}`)
        if (quoted.type) estructuraInfo.push(`type: ${quoted.type}`)
        if (quoted.mimetype) estructuraInfo.push(`mimetype: ${quoted.mimetype}`)
        
        return m.reply(
          '《✧》 No se detectó como mensaje de "Ver una sola vez".\n\n' +
          `📊 Info del mensaje:\n${estructuraInfo.join('\n') || 'No hay datos disponibles'}\n\n` +
          '⚠️ Asegúrate de:\n' +
          '• Responder DIRECTAMENTE al mensaje (no escribir aparte)\n' +
          '• El mensaje debe ser de tipo "Ver una vez" (foto/video que desaparece)\n' +
          '• El mensaje no debe haber expirado aún'
        )
      }
      
      await m.reply('《🔓》 Procesando mensaje de "Ver una sola vez"...')
      
      // === OBTENER EL MEDIA ===
      let mediaBuffer = null
      let mimeType = null
      let caption = ''
      
      // Intentar obtener el contenido del mensaje
      if (mediaContent) {
        // Extraer de la estructura viewOnce
        const imageMsg = mediaContent.imageMessage
        const videoMsg = mediaContent.videoMessage
        const audioMsg = mediaContent.audioMessage
        
        if (imageMsg) {
          mimeType = imageMsg.mimetype
          caption = imageMsg.caption || ''
          if (imageMsg.url) {
            const response = await fetch(imageMsg.url)
            mediaBuffer = await response.buffer()
          }
        }
        else if (videoMsg) {
          mimeType = videoMsg.mimetype
          caption = videoMsg.caption || ''
          if (videoMsg.url) {
            const response = await fetch(videoMsg.url)
            mediaBuffer = await response.buffer()
          }
        }
        else if (audioMsg) {
          mimeType = audioMsg.mimetype || 'audio/mp4'
          if (audioMsg.url) {
            const response = await fetch(audioMsg.url)
            mediaBuffer = await response.buffer()
          }
        }
      }
      
      // Método alternativo: intentar descargar directamente del quoted
      if (!mediaBuffer && quoted.mediaBuffer) {
        mediaBuffer = quoted.mediaBuffer
        mimeType = quoted.mimetype
        console.log('✅ Media obtenido de quoted.mediaBuffer')
      }
      
      // Método alternativo: usar downloadMedia si está disponible
      if (!mediaBuffer && quoted.downloadMedia) {
        try {
          const downloaded = await quoted.downloadMedia()
          mediaBuffer = Buffer.from(downloaded.data, 'base64')
          mimeType = downloaded.mimetype
          console.log('✅ Media obtenido de downloadMedia')
        } catch (err) {
          console.log('Error en downloadMedia:', err.message)
        }
      }
      
      if (!mediaBuffer) {
        return m.reply(
          '《✧》 No se pudo obtener el contenido.\n\n' +
          'Posibles causas:\n' +
          '• El mensaje ya fue abierto y expiró\n' +
          '• El remitente ya eliminó el mensaje\n' +
          '• El formato no es compatible'
        )
      }
      
      // === ENVIAR EL CONTENIDO ===
      if (mimeType?.startsWith('image/')) {
        await sock.sendMessage(
          m.chat,
          {
            image: mediaBuffer,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Imagen recuperada\n📝 ${caption || 'Sin descripción'}\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      } 
      else if (mimeType?.startsWith('video/')) {
        await sock.sendMessage(
          m.chat,
          {
            video: mediaBuffer,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎬 Video recuperado\n📝 ${caption || 'Sin descripción'}\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else if (mimeType?.startsWith('audio/') || mimeType?.includes('mp4')) {
        await sock.sendMessage(
          m.chat,
          {
            audio: mediaBuffer,
            mimetype: 'audio/mp4',
            ptt: true
          },
          { quoted: m }
        )
        
        await sock.sendMessage(
          m.chat,
          {
            text: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎙️ Nota de voz recuperada\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else {
        return m.reply(`《✧》 Tipo de archivo no soportado: ${mimeType || 'desconocido'}`)
      }
      
      console.log('✅ View Once revelado exitosamente')

    } catch (e) {
      console.error('Error completo:', e)
      return m.reply(
        '《✧》 Error al procesar.\n\n' +
        'Detalle: ' + (e.message || 'Error desconocido')
      )
    }
  }
}
