import fs from 'fs'
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

      // === PASO 1: Descargar lo que devuelve la API ===
      const response = await fetch(apiUrl, { timeout: 30000 })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type') || ''
      let videoBuffer = Buffer.from(await response.arrayBuffer())
      
      console.log(`[BRATVID] Tipo: ${contentType}, Tamaño: ${videoBuffer.length} bytes`)

      if (videoBuffer.length < 1000) {
        throw new Error('El archivo está vacío o es muy pequeño')
      }

      // === PASO 2: Determinar y convertir a formato válido ===
      let stickerBuffer = videoBuffer
      let mimetype = 'video/mp4'

      // Si es WEBM, perfecto para stickers
      if (contentType.includes('webm')) {
        mimetype = 'video/webm'
        console.log('[BRATVID] Es WEBM, compatible con stickers')
      }
      // Si es MP4, intentar enviar directamente
      else if (contentType.includes('mp4')) {
        mimetype = 'video/mp4'
        console.log('[BRATVID] Es MP4, intentando enviar como sticker')
      }
      // Si es otra cosa, forzar conversión a MP4
      else {
        console.log('[BRATVID] Formato desconocido, intentando convertir...')
        // Guardar temporalmente
        const tempInput = `/tmp/brat_input_${Date.now()}`
        const tempOutput = `/tmp/brat_output_${Date.now()}.mp4`
        
        fs.writeFileSync(tempInput, videoBuffer)
        
        try {
          // Convertir a MP4 con ffmpeg (si está instalado)
          await execPromise(`ffmpeg -i ${tempInput} -c copy -movflags +faststart ${tempOutput} -y`)
          stickerBuffer = fs.readFileSync(tempOutput)
          mimetype = 'video/mp4'
          console.log('[BRATVID] Conversión exitosa')
        } catch (convError) {
          console.log('[BRATVID] Conversión falló:', convError.message)
        } finally {
          // Limpiar archivos temporales
          try {
            fs.unlinkSync(tempInput)
            fs.unlinkSync(tempOutput)
          } catch(e) {}
        }
      }

      // === PASO 3: Enviar como sticker (INTENTO 1 - Directo) ===
      try {
        await sock.sendMessage(m.chat, {
          sticker: stickerBuffer,
          mimetype: mimetype
        }, { quoted: m })
        
        console.log('[BRATVID] Sticker animado enviado con éxito')
        return
      } catch (stickerError) {
        console.log('[BRATVID] Error al enviar sticker:', stickerError.message)
        
        // === INTENTO 2 - Como GIF/Video con instrucciones ===
        await sock.sendMessage(m.chat, {
          video: stickerBuffer,
          mimetype: 'video/mp4',
          gifPlayback: true,
          caption: `🎬 *${texto}*\n\n⚠️ No se pudo enviar como sticker animado.\n\n*Para convertirlo manualmente a sticker:*\n1. Mantén presionado este video\n2. Selecciona "Convertir a sticker" (si tu WhatsApp lo permite)\n3. O usa el comando \`.sticker\` respondiendo a este video`
        }, { quoted: m })
      }

    } catch (error) {
      console.error('[BRATVID ERROR]', error)
      
      // === Mostrar error detallado ===
      let detalles = ''
      if (error.message.includes('fetch')) detalles = 'No se pudo conectar a la API'
      else if (error.message.includes('HTTP 404')) detalles = 'La API de bratvideo no existe (Error 404)'
      else if (error.message.includes('timeout')) detalles = 'La API tardó demasiado en responder'
      else if (error.message.includes('vacío') || error.message.includes('1000')) detalles = 'La API devolvió un archivo vacío'
      else detalles = error.message
      
      await m.reply(`《❌》 *No se pudo generar el sticker animado*\n\n🔍 *Razón:* ${detalles}\n\n💡 *Alternativas:*\n• Usa \`.brat ${texto}\` para sticker normal\n• Revisa si la API está activa\n• Espera unos minutos y reintenta`)
      
      // Fallback a sticker normal
      try {
        await m.reply('《🔄》 *Intentando con sticker de imagen...*')
        const imgUrl = `https://api.delirius.store/canvas/brat?text=${encodeURIComponent(texto).replace(/%20/g, '+')}`
        const imgRes = await fetch(imgUrl)
        if (imgRes.ok) {
          const imgBuf = Buffer.from(await imgRes.arrayBuffer())
          await sock.sendMessage(m.chat, {
            sticker: imgBuf,
            mimetype: 'image/webp'
          }, { quoted: m })
        }
      } catch (fallbackError) {
        await m.reply('《❌》 Tampoco funcionó la versión imagen. La API puede estar caída.')
      }
    }
  }
}
