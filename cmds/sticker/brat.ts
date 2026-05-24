export default {
  command: ['brat', 'bratsticker', 'stickerbrat'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      let texto = args.join(' ')
      
      if (!texto || texto.trim() === '') {
        await m.reply('《✨》 *¿Cómo usar el comando brat?*\n\nEjemplo:\n`.brat Hola mundo`\n`.brat Nao es lo maximo`')
        return
      }

      await m.reply('《🎨》 *Generando sticker brat...*\n⏱️ Por favor espera un momento')

      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      const apiUrl = `https://api.delirius.store/canvas/brat?text=${textoCodificado}`

      // Descargar la imagen
      const response = await fetch(apiUrl)
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      
      let imagenBuffer = Buffer.from(await response.arrayBuffer())

      // === SOLUCIÓN CLAVE: Convertir a formato WhatsApp Sticker ===
      // Necesitas instalar sharp: npm install sharp
      const sharp = require('sharp')
      
      // Redimensionar y convertir a WEBP con configuración óptima para stickers
      imagenBuffer = await sharp(imagenBuffer)
        .resize(512, 512, {  // Tamaño estándar de stickers
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Fondo transparente si es necesario
        })
        .webp({
          quality: 80,
          effort: 4,
          lossless: false,
          alphaQuality: 100
        })
        .toBuffer()

      // Enviar como sticker con metadatos completos
      await sock.sendMessage(m.chat, {
        sticker: imagenBuffer,
        mimetype: 'image/webp',
        // METADATOS IMPORTANTES para que WhatsApp lo reconozca como sticker
        packageName: 'BratSticker',
        stickerPackName: 'Brat Style',
        stickerAuthor: 'Nelson Bot'
      }, { quoted: m })

      console.log(`[BRAT] Sticker enviado - Texto: ${texto}`)

    } catch (error) {
      console.error('[BRAT ERROR]', error)
      await m.reply('《❌》 *Error al generar el sticker*\n\nIntenta de nuevo o usa texto más corto.')
    }
  }
}
