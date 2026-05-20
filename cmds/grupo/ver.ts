import fetch from 'node-fetch'

export default {
  command: ['reveal', 'viewonce', 'ver'],
  category: 'tools',

  run: async (sock, m, args) => {
    try {
      if (!m.quoted) {
        return m.reply('《✧》 Responde al mensaje de "Ver una sola vez" que quieres revelar.\n\nEjemplo: Responde a la foto/video con .reveal')
      }

      const quoted = m.quoted
      
      await m.reply('《🔓》 Procesando mensaje de "Ver una sola vez"...')
      
      // === OBTENER EL BUFFER ===
      let mediaBuffer = null
      let mimeType = quoted.mime || quoted.mimetype || ''
      let mediaType = quoted.type || 'imageMessage'
      
      // Usar download() que ya sabemos que funciona
      if (typeof quoted.download === 'function') {
        try {
          mediaBuffer = await quoted.download()
          console.log('✅ Buffer obtenido:', mediaBuffer?.length, 'bytes')
          console.log('📝 Tipo de mensaje original:', mediaType)
          console.log('📝 MIME Type:', mimeType)
        } catch (err) {
          console.log('Error en download:', err.message)
        }
      }
      
      // Fallback a mediaBuffer
      if (!mediaBuffer && quoted.mediaBuffer) {
        mediaBuffer = quoted.mediaBuffer
        if (typeof mediaBuffer === 'string') {
          mediaBuffer = Buffer.from(mediaBuffer, 'base64')
        }
      }
      
      if (!mediaBuffer || mediaBuffer.length === 0) {
        return m.reply('《✧》 No se pudo obtener el contenido. El mensaje pudo haber expirado.')
      }
      
      // === DETECTAR EL TIPO REAL DEL MEDIA ===
      // Por si el type no es confiable, detectar por extensión o MIME
      let esVideo = false
      let esImagen = false
      let esAudio = false
      
      // Detectar por MIME type
      if (mimeType.includes('video/')) {
        esVideo = true
      } else if (mimeType.includes('image/')) {
        esImagen = true
      } else if (mimeType.includes('audio/')) {
        esAudio = true
      }
      
      // Detectar por el tipo de mensaje
      if (mediaType === 'videoMessage') {
        esVideo = true
      } else if (mediaType === 'imageMessage') {
        esImagen = true
      } else if (mediaType === 'audioMessage') {
        esAudio = true
      }
      
      // Detectar por los primeros bytes (magic numbers)
      if (!esVideo && !esImagen && !esAudio && mediaBuffer.length > 4) {
        const isPNG = mediaBuffer[0] === 0x89 && mediaBuffer[1] === 0x50
        const isJPEG = mediaBuffer[0] === 0xFF && mediaBuffer[1] === 0xD8
        const isMP4 = mediaBuffer[0] === 0x00 && mediaBuffer[1] === 0x00 && mediaBuffer[2] === 0x00 && mediaBuffer[3] === 0x1C
        const isWEBP = mediaBuffer[0] === 0x52 && mediaBuffer[1] === 0x49 && mediaBuffer[2] === 0x46 && mediaBuffer[3] === 0x46
        
        if (isMP4) esVideo = true
        else if (isPNG || isJPEG) esImagen = true
        else if (isWEBP) esImagen = true
      }
      
      console.log('🎯 Tipo detectado:', { esVideo, esImagen, esAudio })
      
      // === ENVIAR SEGÚN EL TIPO ===
      const tamañoKB = (mediaBuffer.length / 1024).toFixed(2)
      
      if (esVideo) {
        // Enviar como video
        await sock.sendMessage(m.chat, {
          video: mediaBuffer,
          caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎬 VIDEO recuperado\n📦 Tamaño: ${tamañoKB} KB\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
        }, { quoted: m })
        
        console.log('✅ Video enviado correctamente')
        await m.reply('《✅》 Video revelado correctamente.')
        
      } else if (esImagen) {
        // Enviar como imagen
        await sock.sendMessage(m.chat, {
          image: mediaBuffer,
          caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 IMAGEN recuperada\n📦 Tamaño: ${tamañoKB} KB\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
        }, { quoted: m })
        
        console.log('✅ Imagen enviada correctamente')
        await m.reply('《✅》 Imagen revelada correctamente.')
        
      } else if (esAudio) {
        // Enviar como nota de voz
        await sock.sendMessage(m.chat, {
          audio: mediaBuffer,
          mimetype: 'audio/mp4',
          ptt: true
        }, { quoted: m })
        
        console.log('✅ Audio enviado correctamente')
        await m.reply('《✅》 Nota de voz revelada correctamente.')
        
      } else {
        // Tipo desconocido, intentar enviar como documento
        await sock.sendMessage(m.chat, {
          document: mediaBuffer,
          mimetype: mimeType || 'application/octet-stream',
          fileName: `viewonce_${Date.now()}.${mimeType.split('/')[1] || 'bin'}`
        }, { quoted: m })
        
        console.log('✅ Archivo enviado como documento')
        await m.reply('《✅》 Archivo revelado correctamente.')
      }

    } catch (e) {
      console.error('Error completo:', e)
      return m.reply('《✧》 Error al revelar el contenido.\n\nDetalle: ' + (e.message || 'Error desconocido'))
    }
  }
}
