import sharp from 'sharp'

export default {
  command: ['stickerly', 'sly', 'stickersearch'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      // Si no hay texto de búsqueda
      if (!args || args.length === 0) {
        await m.reply(`🎯 *Buscador Automático de Stickers*

📌 *Usa:* \`.stickerly TEXTO\`

💡 *Ejemplos:*
• \`.stickerly my melody\`
• \`.stickerly monos\`
• \`.stickerly sanrio\`
• \`.stickerly kuromi\`

*El bot buscará y enviará los stickers automáticamente* ✨`)
        return
      }

      const query = args.join(' ')
      
      await m.reply(`🔍 *Buscando stickers:* "${query}"\n⏱️ Procesando...`)

      // === BUSCAR EN LA API ===
      const searchUrl = `https://api.delirius.store/search/stickerly?query=${encodeURIComponent(query)}`
      console.log(`[STICKERLY] Buscando: ${searchUrl}`)

      const searchResponse = await fetch(searchUrl)
      
      if (!searchResponse.ok) {
        throw new Error(`Error HTTP: ${searchResponse.status}`)
      }

      const searchResult = await searchResponse.json()
      
      if (!searchResult.status || !searchResult.data || searchResult.data.length === 0) {
        await m.reply(`❌ *No se encontraron stickers* para "${query}"\n\n💡 *Prueba con otras palabras clave* (ej: "cute", "anime", "kawaii")`)
        return
      }

      // Tomar el PRIMER resultado (el más relevante)
      const primerPack = searchResult.data[0]
      const packUrl = primerPack.url
      const packName = primerPack.name
      const packAuthor = primerPack.author
      const packCount = primerPack.sticker_count
      const isAnimated = primerPack.isAnimated

      await m.reply(`✅ *Pack encontrado!*

📌 *${packName.substring(0, 40)}*
👤 *Autor:* ${packAuthor}
📦 *Stickers:* ${packCount}
🎬 *Tipo:* ${isAnimated ? 'Animado' : 'Estático'}

🔄 *Descargando y enviando stickers...*`)

      // === DESCARGAR EL PACK ===
      const downloadUrl = `https://api.delirius.store/download/stickerly?url=${encodeURIComponent(packUrl)}`
      console.log(`[STICKERLY] Descargando pack: ${downloadUrl}`)

      const downloadResponse = await fetch(downloadUrl)
      
      if (!downloadResponse.ok) {
        throw new Error(`Error al descargar pack: ${downloadResponse.status}`)
      }

      const downloadResult = await downloadResponse.json()
      
      if (!downloadResult.status || !downloadResult.data) {
        throw new Error('No se pudo obtener los stickers del pack')
      }

      const stickers = downloadResult.data.stickers || []
      const totalStickers = Math.min(stickers.length, 12) // Máximo 12 stickers

      if (totalStickers === 0) {
        await m.reply('❌ *El pack no tiene stickers válidos*')
        return
      }

      // Enviar stickers uno por uno
      let enviados = 0
      
      for (let i = 0; i < totalStickers; i++) {
        try {
          const stickerUrl = stickers[i]
          console.log(`[STICKERLY] Enviando sticker ${i + 1}/${totalStickers}`)
          
          // Descargar sticker
          const stickerRes = await fetch(stickerUrl)
          
          if (!stickerRes.ok) {
            console.log(`❌ Falló descarga sticker ${i + 1}`)
            continue
          }
          
          let stickerBuffer = Buffer.from(await stickerRes.arrayBuffer())
          
          // Convertir a WEBP si es necesario
          try {
            stickerBuffer = await sharp(stickerBuffer)
              .resize(512, 512, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
              })
              .webp({ quality: 85 })
              .toBuffer()
          } catch (convError) {
            console.log(`⚠️ No se pudo convertir sticker ${i + 1}, usando original`)
          }
          
          // Enviar como sticker
          await sock.sendMessage(m.chat, {
            sticker: stickerBuffer,
            mimetype: 'image/webp'
          }, { quoted: m })
          
          enviados++
          
          // Pequeña pausa entre stickers
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (err) {
          console.log(`❌ Error con sticker ${i + 1}:`, err.message)
        }
      }

      // Mensaje final
      if (enviados > 0) {
        await m.reply(`✅ *Listo!* Se enviaron ${enviados} stickers de "${packName}"`)
        
        // Si hay más stickers en el pack, avisar
        if (stickers.length > totalStickers) {
          await m.reply(`💡 *El pack tiene ${stickers.length} stickers en total.*\nUsa \`.stickerly ${query}\` nuevamente para más.`)
        }
      } else {
        await m.reply(`❌ *No se pudo enviar ningún sticker*\n\n💡 *Intenta con otra búsqueda* (ej: ".stickerly cute")`)
      }

    } catch (error) {
      console.error('[STICKERLY ERROR]', error)
      
      let mensaje = '❌ *Error al buscar stickers*\n\n'
      
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        mensaje += '📡 *Error de conexión*\nNo se pudo conectar a la API de Sticker.ly.\n\n💡 *Intenta de nuevo más tarde*'
      } else if (error.message.includes('HTTP 404')) {
        mensaje += '🔗 *No se encontró el pack*\n\n💡 *Intenta con otra palabra clave*'
      } else {
        mensaje += `⚠️ *Error:* ${error.message}\n\n💡 *Prueba con otra búsqueda como:*\n• .stickerly cute\n• .stickerly anime\n• .stickerly kawaii`
      }
      
      await m.reply(mensaje)
    }
  }
}
