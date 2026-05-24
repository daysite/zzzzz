export default {
  command: ['brat', 'bratsticker', 'stickerbrat'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      // Obtener el texto del comando (lo que viene después del comando)
      let texto = args.join(' ')
      
      // Si no hay texto, pedir que escriban algo
      if (!texto || texto.trim() === '') {
        await m.reply('《✨》 *¿Cómo usar el comando brat?*\n\nEjemplo:\n`.brat Hola mundo`\n`.brat Nao es lo maximo`\n\n*El texto se convertirá en sticker estilo BRAT*')
        return
      }

      // Mostrar mensaje de procesando
      await m.reply('《🎨》 *Generando sticker brat...*\n⏱️ Por favor espera un momento')

      // Codificar el texto para la URL (espacios a +)
      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      
      // URL de la API
      const apiUrl = `https://api.delirius.store/canvas/brat?text=${textoCodificado}`
      
      console.log(`[BRAT] Generando sticker con texto: "${texto}"`)
      console.log(`[BRAT] URL: ${apiUrl}`)

      // Opciones para la petición
      const options = {
        method: 'GET',
        timeout: 30000 // 30 segundos de timeout
      }

      // Función para descargar la imagen con reintentos
      const descargarImagen = async (url, intentos = 2) => {
        for (let i = 0; i < intentos; i++) {
          try {
            const response = await fetch(url, options)
            
            if (response.status === 200) {
              const buffer = await response.arrayBuffer()
              return Buffer.from(buffer)
            } else if (response.status === 404) {
              throw new Error('API no encontrada')
            } else if (response.status === 429) {
              await new Promise(resolve => setTimeout(resolve, 2000))
              continue
            } else {
              throw new Error(`Error ${response.status}`)
            }
          } catch (error) {
            if (i === intentos - 1) throw error
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
      }

      // Descargar la imagen generada
      const imagenBuffer = await descargarImagen(apiUrl)

      // Verificar que tenemos datos
      if (!imagenBuffer || imagenBuffer.length === 0) {
        throw new Error('No se pudo generar la imagen')
      }

      // Enviar como sticker
      await sock.sendMessage(m.chat, {
        sticker: imagenBuffer,
        mimetype: 'image/webp',
        // Si quieres que tenga packname y author
        // packageName: 'Brat Sticker',
        // author: 'Daniel'
      }, { quoted: m })

      console.log(`[BRAT] Sticker enviado exitosamente para: ${texto}`)

    } catch (error) {
      console.error('[BRAT ERROR]', error)
      
      // Mensajes de error más descriptivos
      let mensajeError = '《❌》 *Error al generar el sticker brat*\n\n'
      
      if (error.message.includes('fetch') || error.message.includes('network')) {
        mensajeError += '📡 *Problema de conexión*\nNo se pudo conectar a la API. Verifica tu internet.\n\n💡 *Alternativa:* Intenta de nuevo en unos segundos.'
      } else if (error.message.includes('404')) {
        mensajeError += '🔌 *API no disponible*\nEl servicio puede estar caído temporalmente.\n\n💡 *Alternativa:* Usa otro comando como `.sticker` o intenta más tarde.'
      } else if (error.message.includes('429')) {
        mensajeError += '⏰ *Demasiadas peticiones*\nEspera unos segundos y vuelve a intentar.'
      } else if (error.message.includes('timeout')) {
        mensajeError += '⌛ *Tiempo de espera agotado*\nEl servidor tardó mucho en responder.\n\n💡 *Alternativa:* Intenta con un texto más corto o más tarde.'
      } else {
        mensajeError += `⚠️ Error: ${error.message || 'Desconocido'}\n\n💡 *Soluciones:*\n• Revisa que el texto no sea muy largo\n• Espera unos segundos y reintenta\n• Usa texto sin caracteres raros`
      }
      
      await m.reply(mensajeError)
    }
  }
}
