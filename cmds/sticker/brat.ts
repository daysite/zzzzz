import sharp from 'sharp'
import fetch from 'node-fetch'

export default {
  command: ['brat', 'bratsticker', 'stickerbrat'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      let texto = args.join(' ')
      
      if (!texto || texto.trim() === '') {
        await m.reply('《✨》 *¿Cómo usar el comando brat?*\n\nEjemplo:\n`.brat Hola mundo`\n`.brat Nao es lo maximo`\n\n*El texto se convertirá en sticker estilo BRAT*')
        return
      }

      await m.reply('《🎨》 *Generando sticker brat...*\n⏱️ Por favor espera un momento')

      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      const apiUrl = `https://api.delirius.store/canvas/brat?text=${textoCodificado}`
      
      console.log(`[BRAT] Generando sticker con texto: "${texto}"`)

      // Descargar la imagen de la API
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      let imagenBuffer = Buffer.from(await response.arrayBuffer())

      // Verificar si sharp está disponible y convertir a formato sticker
      try {
        // Redimensionar y convertir a WEBP con configuración óptima para stickers
        imagenBuffer = await sharp(imagenBuffer)
          .resize(512, 512, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .webp({
            quality: 85,
            effort: 4
          })
          .toBuffer()
        
        console.log(`[BRAT] Imagen convertida a WEBP - Tamaño: ${imagenBuffer.length} bytes`)
      } catch (sharpError) {
        console.log('[BRAT] Sharp no disponible o error, usando imagen original')
        // Si sharp falla, intentar enviar la imagen original
      }

      // Enviar como sticker
      await sock.sendMessage(m.chat, {
        sticker: imagenBuffer,
        mimetype: 'image/webp'
      }, { quoted: m })

      console.log(`[BRAT] Sticker enviado exitosamente para: ${texto}`)

    } catch (error) {
      console.error('[BRAT ERROR]', error)
      
      let mensajeError = '《❌》 *Error al generar el sticker brat*\n\n'
      
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        mensajeError += '📡 *Error de conexión*\nNo se pudo conectar a la API.\n\n💡 *Intenta:*\n• Usa texto sin caracteres especiales\n• Espera unos segundos y reintenta'
      } else if (error.message.includes('HTTP 404')) {
        mensajeError += '🔌 *API no disponible*\nEl servicio puede estar caído.\n\n💡 *Alternativa:* Usa `.sticker` con una imagen normal'
      } else if (error.message.includes('timeout')) {
        mensajeError += '⌛ *Tiempo de espera agotado*\n\n💡 *Intenta con texto más corto*'
      } else {
        mensajeError += `⚠️ Error: ${error.message || 'Desconocido'}\n\n💡 *Recomendación:*\n• Usa texto sin espacios al inicio/fin\n• Intenta de nuevo en unos segundos`
      }
      
      await m.reply(mensajeError)
    }
  }
}
