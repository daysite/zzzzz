export default {
  command: ['bratvid', 'bratvideo', 'bratv'],
  category: 'video',

  run: async (sock, m, args) => {
    try {
      // Obtener el texto del comando
      let texto = args.join(' ')
      
      // Validar que haya texto
      if (!texto || texto.trim() === '') {
        await m.reply('《🎬》 *¿Cómo usar el comando bratvideo?*\n\nEjemplo:\n`.bratvid Hola mundo`\n`.bratvideo Nao es lo maximo`\n`.bratv Verano 2024`\n\n*El texto se convertirá en un video estilo BRAT*')
        return
      }

      // Mensaje de procesando
      await m.reply('《🎬》 *Generando video brat...*\n⏱️ Esto puede tomar unos segundos')

      // Codificar el texto para la URL
      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      
      // URL de la API de video
      const apiUrl = `https://api.delirius.store/canvas/bratvideo?text=${textoCodificado}`
      
      console.log(`[BRATVID] Generando video con texto: "${texto}"`)
      console.log(`[BRATVID] URL: ${apiUrl}`)

      // Opciones para la petición
      const options = {
        method: 'GET',
        timeout: 45000 // 45 segundos para videos (más tiempo)
      }

      // Descargar el video
      const response = await fetch(apiUrl, options)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      // Verificar el tipo de contenido
      const contentType = response.headers.get('content-type') || ''
      const videoBuffer = Buffer.from(await response.arrayBuffer())
      
      console.log(`[BRATVID] Video descargado - Tamaño: ${videoBuffer.length} bytes | Tipo: ${contentType}`)

      // Verificar que no esté vacío
      if (videoBuffer.length === 0) {
        throw new Error('El video generado está vacío')
      }

      // Determinar el mimetype correcto
      let mimetype = 'video/mp4'
      if (contentType.includes('webm')) mimetype = 'video/webm'
      if (contentType.includes('mp4')) mimetype = 'video/mp4'
      
      // Enviar como video
      await sock.sendMessage(m.chat, {
        video: videoBuffer,
        mimetype: mimetype,
        caption: `🎬 *Video Brat*\n📝 Texto: "${texto}"\n\n✨ Generado con estilo BRAT`,
        gifPlayback: false // Si quieres que se reproduzca como GIF, cambia a true
      }, { quoted: m })

      console.log(`[BRATVID] Video enviado exitosamente para: ${texto}`)

    } catch (error) {
      console.error('[BRATVID ERROR]', error)
      
      let mensajeError = '《❌》 *Error al generar el video brat*\n\n'
      
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED') || error.message.includes('network')) {
        mensajeError += '📡 *Error de conexión*\nNo se pudo conectar a la API de video.\n\n💡 *Posibles causas:*\n• La API puede estar caída temporalmente\n• Tu conexión a internet está inestable\n\n💡 *Soluciones:*\n• Espera unos minutos y reintenta\n• Usa texto más corto\n• Prueba el comando `.brat` (imagen) mientras tanto'
      } else if (error.message.includes('HTTP 404')) {
        mensajeError += '🔌 *API de video no disponible*\nEl servicio de bratvideo puede estar deshabilitado.\n\n💡 *Alternativas:*\n• Usa `.brat` para sticker de imagen\n• Espera a que el servicio se restablezca'
      } else if (error.message.includes('timeout')) {
        mensajeError += '⌛ *Tiempo de espera agotado*\nEl servidor tardó demasiado en generar el video.\n\n💡 *Recomendaciones:*\n• Usa texto más corto (menos de 50 caracteres)\n• Evita caracteres especiales\n• Espera unos segundos y reintenta'
      } else if (error.message.includes('empty') || error.message.includes('vacío')) {
        mensajeError += '📭 *Video vacío*\nLa API generó un archivo sin contenido.\n\n💡 *Intenta:*\n• Usa texto diferente\n• No uses solo números\n• Prueba más tarde'
      } else {
        mensajeError += `⚠️ Error técnico: ${error.message || 'Desconocido'}\n\n💡 *Para solucionar:*\n• Verifica que la API esté activa: ${apiUrl}\n• Usa texto en inglés o sin acentos\n• Contacta al administrador del bot`
      }
      
      await m.reply(mensajeError)
      
      // Opción: intentar enviar como sticker de imagen como fallback
      try {
        await m.reply('《🔄》 *Intentando generar sticker de imagen como alternativa...*')
        const imgApiUrl = `https://api.delirius.store/canvas/brat?text=${encodeURIComponent(texto).replace(/%20/g, '+')}`
        const imgResponse = await fetch(imgApiUrl)
        
        if (imgResponse.ok) {
          const imgBuffer = Buffer.from(await imgResponse.arrayBuffer())
          await sock.sendMessage(m.chat, {
            image: imgBuffer,
            caption: `🎨 *Alternativa (Sticker BRAT)*\n📝 Texto: "${texto}"\n\n⚠️ El video no se pudo generar, pero aquí tienes la versión imagen.\n*Usa .sticker para convertir a sticker*`
          }, { quoted: m })
        }
      } catch (fallbackError) {
        console.log('[BRATVID] Fallback también falló:', fallbackError.message)
      }
    }
  }
}
