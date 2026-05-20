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

      const quotedMsg = m.quoted
        
      // Verificar si el mensaje respondido es de tipo "viewOnce"
      if (!quotedMsg.viewOnce && !quotedMsg.isViewOnce) {
        return m.reply(
          '《✧》 Este mensaje no es de "Ver una sola vez". Responde al mensaje efímero que desaparece tras abrirse.'
        )
      }

      // Verificar qué tipo de mensaje viewOnce es
      const isViewOnceImage = quotedMsg.viewOnce || 
                              (quotedMsg.message?.viewOnceMessageV2?.message?.imageMessage) ||
                              (quotedMsg.message?.viewOnceMessage?.message?.imageMessage)

      const isViewOnceVideo = quotedMsg.message?.viewOnceMessageV2?.message?.videoMessage ||
                              quotedMsg.message?.viewOnceMessage?.message?.videoMessage

      const isViewOnceAudio = quotedMsg.message?.viewOnceMessageV2?.message?.audioMessage ||
                              quotedMsg.message?.viewOnceMessage?.message?.audioMessage

      let mediaBuffer
      let mimeType
      let caption = ''

      await m.reply('《🔓》 Procesando mensaje de "Ver una sola vez"...')

      // Extraer el buffer del mensaje viewOnce - MÉTODO 1: Directo de quotedMsg
      if (quotedMsg.mediaBuffer) {
        mediaBuffer = quotedMsg.mediaBuffer
        mimeType = quotedMsg.mimetype
      } 
      // MÉTODO 2: Descargar usando downloadMedia
      else if (quotedMsg.downloadMedia) {
        const downloaded = await quotedMsg.downloadMedia()
        mediaBuffer = Buffer.from(downloaded.data, 'base64')
        mimeType = downloaded.mimetype
      }
      // MÉTODO 3: Desde la estructura de message
      else if (quotedMsg.message) {
        const msg = quotedMsg.message
        
        // Buscar en diferentes estructuras de viewOnce
        let mediaMsg = null
        
        if (msg.viewOnceMessageV2?.message) {
          mediaMsg = msg.viewOnceMessageV2.message
        } else if (msg.viewOnceMessage?.message) {
          mediaMsg = msg.viewOnceMessage.message
        } else if (msg.message?.viewOnceMessageV2?.message) {
          mediaMsg = msg.message.viewOnceMessageV2.message
        }
        
        if (mediaMsg) {
          const imageMsg = mediaMsg.imageMessage || mediaMsg.videoMessage || mediaMsg.audioMessage
          if (imageMsg?.url) {
            caption = imageMsg.caption || ''
            mimeType = imageMsg.mimetype
            // Intentar descargar usando fetch
            const response = await fetch(imageMsg.url)
            mediaBuffer = await response.buffer()
          }
        }
      }

      if (!mediaBuffer) {
        return m.reply('《✧》 No se pudo obtener el contenido del mensaje efímero. El mensaje podría haber expirado.')
      }

      // Determinar el tipo de archivo y enviar
      if (mimeType?.startsWith('image/')) {
        await sock.sendMessage(
          m.chat,
          {
            image: mediaBuffer,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Tipo: Imagen\n📝 ${caption || 'Sin descripción'}\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      } 
      else if (mimeType?.startsWith('video/')) {
        await sock.sendMessage(
          m.chat,
          {
            video: mediaBuffer,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎬 Tipo: Video\n📝 ${caption || 'Sin descripción'}\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else if (mimeType?.startsWith('audio/')) {
        // Para audios, enviar como nota de voz
        await sock.sendMessage(
          m.chat,
          {
            audio: mediaBuffer,
            mimetype: 'audio/mp4',
            ptt: true // Enviar como nota de voz
          },
          { quoted: m }
        )
        
        await sock.sendMessage(
          m.chat,
          {
            text: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n🎙️ Tipo: Nota de voz (View Once)\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else {
        return m.reply('《✧》 El contenido no es una imagen, video o nota de voz válida.')
      }

    } catch (e) {
      console.error('Error reveal viewOnce:', e)
      return m.reply(
        '《✧》 Error al revelar el mensaje. Asegúrate de responder directamente al mensaje de "Ver una sola vez".'
      )
    }
  }
}
