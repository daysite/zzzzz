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
      
      // === DETECCIÓN DE VIEW ONCE BASADA EN LA ESTRUCTURA REAL ===
      let isViewOnce = false
      let mediaUrl = null
      let mimeType = null
      let caption = ''
      let mediaBuffer = null
      
      // Verificar si el mensaje tiene la estructura imageMessage
      if (quoted.type === 'imageMessage' && quoted.msg) {
        const msgObj = quoted.msg
        
        // Buscar el flag de viewOnce en la estructura
        // En algunos casos, viewOnce está dentro de imageMessage
        if (msgObj.viewOnce === true || msgObj.isViewOnce === true) {
          isViewOnce = true
          mediaUrl = msgObj.url
          mimeType = msgObj.mimetype
          caption = msgObj.caption || ''
          console.log('✅ ViewOnce detectado en msg.viewOnce')
        }
        
        // Verificar si el mensaje tiene la propiedad que indica viewOnce
        // En la estructura de baileys, viewOnce puede estar en la raíz
        if (quoted.viewOnce === true || quoted.isViewOnce === true) {
          isViewOnce = true
          console.log('✅ ViewOnce detectado en quoted.viewOnce')
        }
      }
      
      // Si no se detectó automáticamente, preguntar al usuario
      if (!isViewOnce) {
        return m.reply(
          '《❓》 ¿Este mensaje es de "Ver una sola vez"?\n\n' +
          'Responde con:\n' +
          '• `.si` - Si es una foto/video que desaparece\n' +
          '• `.no` - Si es un mensaje normal\n\n' +
          '⚠️ El bot intentará extraer el contenido si es posible.'
        )
      }
      
      await m.reply('《🔓》 Procesando mensaje de "Ver una sola vez"...')
      
      // === OBTENER EL MEDIA ===
      if (mediaUrl) {
        // Descargar desde la URL
        try {
          const response = await fetch(mediaUrl)
          mediaBuffer = await response.buffer()
          console.log('✅ Media descargado desde URL')
        } catch (err) {
          console.log('Error descargando desde URL:', err.message)
        }
      }
      
      // Método alternativo: usar el buffer si está disponible
      if (!mediaBuffer && quoted.mediaBuffer) {
        mediaBuffer = quoted.mediaBuffer
        console.log('✅ Media obtenido de quoted.mediaBuffer')
      }
      
      // Método alternativo: usar download si está disponible
      if (!mediaBuffer && quoted.download) {
        try {
          mediaBuffer = await quoted.download()
          console.log('✅ Media obtenido de quoted.download()')
        } catch (err) {
          console.log('Error en download:', err.message)
        }
      }
      
      if (!mediaBuffer) {
        return m.reply(
          '《✧》 No se pudo obtener el contenido.\n\n' +
          'El mensaje puede haber expirado o el remitente lo eliminó.'
        )
      }
      
      // Obtener mimeType si no lo tenemos
      if (!mimeType && quoted.mime) {
        mimeType = quoted.mime
      }
      
      if (!mimeType && quoted.mimetype) {
        mimeType = quoted.mimetype
      }
      
      // === ENVIAR EL CONTENIDO ===
      if (mimeType?.startsWith('image/') || quoted.type === 'imageMessage') {
        await sock.sendMessage(
          m.chat,
          {
            image: mediaBuffer,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Imagen recuperada\n📝 ${caption || 'Sin descripción'}\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      } 
      else if (mimeType?.startsWith('video/') || quoted.type === 'videoMessage') {
        await sock.sendMessage(
          m.chat,
          {
            video: mediaBuffer,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎬 Video recuperado\n📝 ${caption || 'Sin descripción'}\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else if (mimeType?.startsWith('audio/') || quoted.type === 'audioMessage') {
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
            text: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎙️ Nota de voz recuperada\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else {
        return m.reply(`《✧》 Tipo no soportado: ${mimeType || quoted.type || 'desconocido'}`)
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
