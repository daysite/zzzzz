import { promises as fs } from 'fs'
import path from 'path'

export default {
  command: ['stickerly', 'sly', 'stickersearch'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      // Verificar si hay argumentos
      if (!args || args.length === 0) {
        await m.reply(`🎯 *Buscador de Stickers - Sticker.ly*

📌 *Comandos disponibles:*

🔍 *Buscar stickers:*
\`.stickerly buscar my melody\`
\`.sly search kuromi\`

📦 *Descargar pack por URL:*
\`.stickerly url https://sticker.ly/s/MPTYYK\`

💡 *Ejemplos:*
\`.stickerly buscar sanrio\`
\`.sly url https://sticker.ly/s/5LAA3M\`

*Los stickers se enviarán automáticamente como stickers de WhatsApp*`)

        return
      }

      const action = args[0].toLowerCase()
      const query = args.slice(1).join(' ')

      // === BÚSQUEDA DE STICKERS ===
      if (action === 'buscar' || action === 'search') {
        if (!query) {
          await m.reply('📝 *Escribe lo que quieres buscar*\n\nEjemplo: `.stickerly buscar my melody`')
          return
        }

        await m.reply(`🔍 *Buscando stickers:* ${query}\n⏱️ Esto puede tomar unos segundos...`)

        const searchUrl = `https://api.delirius.store/search/stickerly?query=${encodeURIComponent(query)}`
        console.log(`[STICKERLY] Buscando: ${searchUrl}`)

        const response = await fetch(searchUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.status || !result.data || result.data.length === 0) {
          await m.reply(`❌ *No se encontraron stickers* para "${query}"\n\n💡 *Intenta con otras palabras clave*`)
          return
        }

        // Mostrar resultados (máximo 10 para no saturar)
        const resultados = result.data.slice(0, 10)
        
        let mensaje = `🎯 *Resultados para:* "${query}"\n\n`
        
        for (let i = 0; i < resultados.length; i++) {
          const pack = resultados[i]
          const animado = pack.isAnimated ? '🎬 Animado' : '🖼️ Estático'
          mensaje += `${i + 1}. *${pack.name.substring(0, 40)}*\n`
          mensaje += `   👤 ${pack.author} | 📦 ${pack.sticker_count} stickers | ${animado}\n`
          mensaje += `   🔗 \`${pack.url}\`\n\n`
        }
        
        mensaje += `📌 *Para descargar un pack:*\n\`.stickerly url URL_DEL_PACK\`\n\n💡 *Ejemplo:* \`.stickerly url ${resultados[0].url}\``
        
        await m.reply(mensaje)

      // === DESCARGA POR URL ===
      } else if (action === 'url' || action === 'descargar' || action === 'download') {
        const url = query.trim()
        
        if (!url || !url.includes('sticker.ly/s/')) {
          await m.reply('🔗 *Envía una URL válida de Sticker.ly*\n\nEjemplo: `.stickerly url https://sticker.ly/s/MPTYYK`\n\n*La URL debe tener el formato:* `sticker.ly/s/XXXXX`')
          return
        }

        await m.reply(`📦 *Descargando pack de stickers...*\n⏱️ Obteniendo información del pack...`)

        const downloadUrl = `https://api.delirius.store/download/stickerly?url=${encodeURIComponent(url)}`
        console.log(`[STICKERLY] Descargando: ${downloadUrl}`)

        const response = await fetch(downloadUrl)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const result = await response.json()
        
        if (!result.status || !result.data) {
          throw new Error('No se pudo obtener el pack')
        }

        const pack = result.data
        const stickers = pack.stickers || []
        const isAnimated = pack.isAnimated
        const totalStickers = stickers.length

        await m.reply(`✅ *Pack encontrado!*

📌 *Nombre:* ${pack.name}
👤 *Autor:* ${pack.author}
📦 *Stickers:* ${totalStickers}
🎬 *Tipo:* ${isAnimated ? 'Animado (WEBM)' : 'Estático (PNG/WEBP)'}
👀 *Vistas:* ${pack.viewCount || 'N/A'}
📥 *Descargas:* ${pack.exportCount || 'N/A'}

🔄 *Enviando stickers...* (Esto puede tomar un momento)`)

        // Enviar stickers uno por uno (máximo 15 para no saturar)
        const maxStickers = Math.min(totalStickers, 15)
        let enviados = 0
        let fallidos = 0

        for (let i = 0; i < maxStickers; i++) {
          try {
            const stickerUrl = stickers[i]
            console.log(`[STICKERLY] Descargando sticker ${i + 1}/${maxStickers}: ${stickerUrl}`)
            
            // Descargar el sticker
            const stickerResponse = await fetch(stickerUrl)
            
            if (!stickerResponse.ok) {
              throw new Error(`HTTP ${stickerResponse.status}`)
            }
            
            let stickerBuffer = Buffer.from(await stickerResponse.arrayBuffer())
            const contentType = stickerResponse.headers.get('content-type') || ''
            
            // Determinar mimetype
            let mimetype = 'image/webp'
            if (contentType.includes('png')) mimetype = 'image/png'
            else if (contentType.includes('webp')) mimetype = 'image/webp'
            else if (contentType.includes('gif')) mimetype = 'image/gif'
            
            // Si es animado, usar video/webm
            if (isAnimated) {
              mimetype = 'video/webm'
            }
            
            // Enviar como sticker
            await sock.sendMessage(m.chat, {
              sticker: stickerBuffer,
              mimetype: mimetype
            }, { quoted: m })
            
            enviados++
            
            // Pequeña pausa para evitar rate limiting
            await new Promise(resolve => setTimeout(resolve, 500))
            
          } catch (stickerError) {
            console.error(`[STICKERLY] Error con sticker ${i + 1}:`, stickerError.message)
            fallidos++
          }
        }

        // Mensaje de resumen
        let resumen = `✅ *Pack descargado correctamente!*\n\n`
        resumen += `📦 *${pack.name}*\n`
        resumen += `✅ Enviados: ${enviados}/${maxStickers} stickers\n`
        
        if (fallidos > 0) {
          resumen += `⚠️ Fallidos: ${fallidos}\n`
        }
        
        if (totalStickers > maxStickers) {
          resumen += `\n💡 *El pack tiene ${totalStickers} stickers en total.*\nPara más, usa otro comando o descarga manualmente.`
        }
        
        await m.reply(resumen)

      } else {
        await m.reply(`❌ *Comando no reconocido*

📌 *Usa:*
\`.stickerly buscar TEXTO\` - Para buscar stickers
\`.stickerly url URL\` - Para descargar un pack

💡 *Ejemplos:*
\`.stickerly buscar my melody\`
\`.stickerly url https://sticker.ly/s/MPTYYK\``)
      }

    } catch (error) {
      console.error('[STICKERLY ERROR]', error)
      
      let mensajeError = '❌ *Error al procesar la solicitud*\n\n'
      
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        mensajeError += '📡 *Error de conexión*\nNo se pudo conectar a la API de Sticker.ly.\n\n💡 *Intenta de nuevo más tarde*'
      } else if (error.message.includes('HTTP 404')) {
        mensajeError += '🔗 *Pack no encontrado*\nLa URL puede ser inválida o el pack ha sido eliminado.\n\n💡 *Verifica la URL e intenta de nuevo*'
      } else {
        mensajeError += `⚠️ *Error:* ${error.message}\n\n💡 *Verifica que la URL sea correcta y vuelve a intentar*`
      }
      
      await m.reply(mensajeError)
    }
  }
}
