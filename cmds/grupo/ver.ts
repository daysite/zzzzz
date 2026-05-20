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
      let mimeType = quoted.mime || quoted.mimetype || 'image/jpeg'
      
      // Usar download() que ya sabemos que funciona
      if (typeof quoted.download === 'function') {
        try {
          mediaBuffer = await quoted.download()
          console.log('✅ Buffer obtenido:', mediaBuffer?.length, 'bytes')
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
        return m.reply('《✧》 No se pudo obtener la imagen. El mensaje pudo haber expirado.')
      }
      
      // === ENVIAR LA IMAGEN (VERSIÓN CORREGIDA) ===
      try {
        // OPCIÓN 1: Enviar como buffer directo (la más común)
        await sock.sendMessage(m.chat, {
          image: mediaBuffer,
          caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Imagen recuperada\n📦 Tamaño: ${(mediaBuffer.length / 1024).toFixed(2)} KB\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
        }, { quoted: m })
        
        console.log('✅ Imagen enviada (método 1)')
        
      } catch (error1) {
        console.log('Error método 1:', error1.message)
        
        try {
          // OPCIÓN 2: Convertir a base64 y enviar como URL
          const base64 = mediaBuffer.toString('base64')
          
          await sock.sendMessage(m.chat, {
            image: `data:${mimeType};base64,${base64}`,
            caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Imagen recuperada\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
          }, { quoted: m })
          
          console.log('✅ Imagen enviada (método 2 - base64)')
          
        } catch (error2) {
          console.log('Error método 2:', error2.message)
          
          try {
            // OPCIÓN 3: Usar un objeto URL
            const { default: stream } = await import('stream')
            const { Buffer } = await import('buffer')
            
            const readableStream = new stream.Readable()
            readableStream.push(mediaBuffer)
            readableStream.push(null)
            
            await sock.sendMessage(m.chat, {
              image: readableStream,
              caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Imagen recuperada\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
            }, { quoted: m })
            
            console.log('✅ Imagen enviada (método 3 - stream)')
            
          } catch (error3) {
            console.log('Error método 3:', error3.message)
            
            // OPCIÓN 4: Guardar temporalmente y enviar como archivo
            const fs = await import('fs')
            const path = await import('path')
            const os = await import('os')
            
            const tempFile = path.join(os.tmpdir(), `reveal_${Date.now()}.jpg`)
            fs.writeFileSync(tempFile, mediaBuffer)
            
            await sock.sendMessage(m.chat, {
              image: { url: tempFile },
              caption: `╭─〔 VIEW ONCE REVEALED 〕─⬣\n\n📷 Imagen recuperada\n\n⚠️ Este mensaje era de "Ver una sola vez"\n\n╰────────────────⬣`
            }, { quoted: m })
            
            // Limpiar archivo temporal
            fs.unlinkSync(tempFile)
            
            console.log('✅ Imagen enviada (método 4 - archivo temporal)')
          }
        }
      }
      
      await m.reply('《✅》 Imagen revelada correctamente.')

    } catch (e) {
      console.error('Error general:', e)
      return m.reply('《✧》 Error al revelar la imagen.\n\nDetalle: ' + (e.message || 'Error desconocido'))
    }
  }
}
