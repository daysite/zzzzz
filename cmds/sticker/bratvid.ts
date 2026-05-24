import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

export default {
  command: ['bratvid', 'bratvideo', 'bratv'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      let texto = args.join(' ')
      
      if (!texto || texto.trim() === '') {
        await m.reply('《🎬》 *¿Cómo usar el comando bratvideo?*\n\nEjemplo:\n`.bratvid Hola mundo`\n\n*El texto se convertirá en sticker animado*')
        return
      }

      await m.reply('《🎬》 *Generando sticker animado...*\n⏱️ Procesando, espera...')

      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      const apiUrl = `https://api.delirius.store/canvas/bratvideo?text=${textoCodificado}`
      
      console.log(`[BRATVID] URL: ${apiUrl}`)

      // Descargar video
      const response = await fetch(apiUrl, { timeout: 30000 })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type') || ''
      let videoBuffer = Buffer.from(await response.arrayBuffer())
      
      console.log(`[BRATVID] Tipo: ${contentType}, Tamaño: ${videoBuffer.length} bytes`)

      // === VALIDACIÓN CRÍTICA ===
      if (videoBuffer.length < 5000) {
        throw new Error(`El archivo es muy pequeño (${videoBuffer.length} bytes) - Posiblemente corrupto`)
      }

      // Verificar que sea un MP4 válido (tiene cabecera ftyp)
      const isMp4 = videoBuffer.toString('hex', 4, 8) === '66747970' // 'ftyp' en hex
      if (!isMp4) {
        console.log('[BRATVID] No es un MP4 válido, cabecera:', videoBuffer.toString('hex', 0, 20))
        throw new Error('El archivo no es un MP4 válido')
      }

      // === INTENTO 1: Enviar como sticker MP4 ===
      try {
        const result = await sock.sendMessage(m.chat, {
          sticker: videoBuffer,
          mimetype: 'video/mp4'
        }, { quoted: m })
        
        console.log('[BRATVID] Enviado como sticker, resultado:', result ? 'OK' : 'Sin respuesta')
        return // Si funciona, terminamos
      } catch (stickerError) {
        console.log('[BRATVID] Error como sticker:', stickerError.message)
        
        // === INTENTO 2: Enviar como GIF (video con gifPlayback) ===
        try {
          await sock.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: 'video/mp4',
            gifPlayback: true,
            caption: `🎬 *${texto}*\n\n🔄 No se pudo enviar como sticker, pero aquí está como GIF`
          }, { quoted: m })
          console.log('[BRATVID] Enviado como GIF')
          return
        } catch (gifError) {
          console.log('[BRATVID] Error como GIF:', gifError.message)
        }
        
        // === INTENTO 3: Guardar y reenviar como documento (para debug) ===
        const tempFile = `/tmp/brat_${Date.now()}.mp4`
        await fs.writeFile(tempFile, videoBuffer)
        
        await sock.sendMessage(m.chat, {
          document: videoBuffer,
          mimetype: 'video/mp4',
          fileName: `brat_${texto.slice(0, 20)}.mp4`,
          caption: `🎬 *${texto}*\n\n⚠️ No se pudo enviar como sticker ni GIF.\n\n📁 Archivo original adjunto.\n💡 Intenta convertirlo manualmente a sticker.`
        }, { quoted: m })
        
        // Limpiar
        await fs.unlink(tempFile).catch(() => {})
      }

    } catch (error) {
      console.error('[BRATVID ERROR]', error)
      
      let mensajeError = '《❌》 *Error al generar el sticker animado*\n\n'
      
      if (error.message.includes('pequeño') || error.message.includes('bytes')) {
        mensajeError += `📉 *Archivo corrupto o muy pequeño*\n\nLa API devolvió un archivo de ${error.message.match(/\d+/)?.[0] || 'tamaño'} bytes, que es insuficiente.\n\n💡 *Posible solución:*\n• Espera unos minutos y reintenta\n• Usa texto diferente\n• Prueba con \`.brat ${texto}\` (sticker normal)`
      } else if (error.message.includes('MP4 válido')) {
        mensajeError += `🔧 *Formato inválido*\n\nLa API no devolvió un MP4 válido.\n\n💡 *Alternativa:* Usa \`.brat ${texto}\` para sticker normal`
      } else if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        mensajeError += `📡 *Error de conexión*\nNo se pudo conectar a la API.\n\n💡 *Espera unos minutos y reintenta*`
      } else {
        mensajeError += `⚠️ *Error técnico:* ${error.message}\n\n💡 *Alternativa:* Usa \`.brat ${texto}\``
      }
      
      await m.reply(mensajeError)
      
      // Fallback a sticker normal
      try {
        const imgUrl = `https://api.delirius.store/canvas/brat?text=${encodeURIComponent(texto).replace(/%20/g, '+')}`
        const imgRes = await fetch(imgUrl)
        if (imgRes.ok) {
          const imgBuf = Buffer.from(await imgRes.arrayBuffer())
          await sock.sendMessage(m.chat, {
            sticker: imgBuf,
            mimetype: 'image/webp'
          }, { quoted: m })
          console.log('[BRATVID] Fallback a sticker normal exitoso')
        }
      } catch (fallbackError) {
        console.log('[BRATVID] Fallback falló:', fallbackError.message)
      }
    }
  }
}
