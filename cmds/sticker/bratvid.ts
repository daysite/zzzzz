export default {
  command: ['bratvid', 'bratvideo', 'bratv'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      // Obtener el texto del comando
      let texto = args.join(' ')
      
      // Validar que haya texto
      if (!texto || texto.trim() === '') {
        await m.reply('《🎬》 *¿Cómo usar el comando bratvideo?*\n\nEjemplo:\n`.bratvid Hola mundo`\n`.bratvideo Nao es lo maximo`\n`.bratv Verano 2024`\n\n*El texto se convertirá en un STICKER ANIMADO estilo BRAT*')
        return
      }

      // Mensaje de procesando
      await m.reply('《🎬》 *Generando sticker animado brat...*\n⏱️ Esto puede tomar unos segundos')

      // Codificar el texto para la URL
      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      
      // URL de la API de video
      const apiUrl = `https://api.delirius.store/canvas/bratvideo?text=${textoCodificado}`
      
      console.log(`[BRATVID] Generando sticker animado con texto: "${texto}"`)
      console.log(`[BRATVID] URL: ${apiUrl}`)

      // Opciones para la petición
      const options = {
        method: 'GET',
        timeout: 45000 // 45 segundos para videos
      }

      // Descargar el video
      const response = await fetch(apiUrl, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const videoBuffer = Buffer.from(await response.arrayBuffer())
      
      console.log(`[BRATVID] Video descargado - Tamaño: ${videoBuffer.length} bytes`)

      // Verificar que no esté vacío
      if (videoBuffer.length === 0) {
        throw new Error('El video generado está vacío')
      }

      // === CLAVE: Enviar como STICKER ANIMADO ===
      await sock.sendMessage(m.chat, {
        sticker: videoBuffer,  // ← Usar 'sticker' no 'video'
        mimetype: 'video/mp4',  // WhatsApp acepta MP4 como sticker animado
        // Metadatos opcionales para el sticker
        packageName: 'BratAnimado',
        stickerPackName: 'Brat Video Style',
        stickerAuthor: 'Nelson Bot'
      }, { quoted: m })

      console.log(`[BRATVID] Sticker animado enviado exitosamente para: ${texto}`)

    } catch (error) {
      console.error('[BRATVID ERROR]', error)
      
      let mensajeError = '《❌》 *Error al generar el sticker animado brat*\n\n'
      
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        mensajeError += '📡 *Error de conexión*\nNo se pudo conectar a la API.\n\n💡 *Soluciones:*\n• Espera unos minutos y reintenta\n• Usa texto más corto\n• Prueba el comando `.brat` (sticker normal)'
      } else if (error.message.includes('HTTP 404')) {
        mensajeError += '🔌 *API de video no disponible*\n\n💡 *Alternativa:* Usa `.brat` para sticker de imagen'
      } else if (error.message.includes('timeout')) {
        mensajeError += '⌛ *Tiempo de espera agotado*\n\n💡 *Recomendaciones:*\n• Usa texto más corto (menos de 50 caracteres)\n• Evita caracteres especiales'
      } else {
        mensajeError += `⚠️ Error: ${error.message || 'Desconocido'}\n\n💡 *Prueba con:*\n• Texto en inglés sin acentos\n• .brat (versión imagen)`
      }
      
      await m.reply(mensajeError)
      
      // Fallback: intentar sticker de imagen normal
      try {
        await m.reply('《🔄》 *Intentando generar sticker de imagen como alternativa...*')
        const imgApiUrl = `https://api.delirius.store/canvas/brat?text=${encodeURIComponent(texto).replace(/%20/g, '+')}`
        const imgResponse = await fetch(imgApiUrl)
        
        if (imgResponse.ok) {
          const imgBuffer = Buffer.from(await imgResponse.arrayBuffer())
          await sock.sendMessage(m.chat, {
            sticker: imgBuffer,
            mimetype: 'image/webp'
          }, { quoted: m })
        }
      } catch (fallbackError) {
        console.log('[BRATVID] Fallback falló:', fallbackError.message)
        await m.reply('《❌》 No se pudo generar ni el video ni la imagen. Intenta más tarde.')
      }
    }
  }
}
