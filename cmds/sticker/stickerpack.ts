import axios from 'axios'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const isStickerUrl = (url) => {
  return /^(https?:\/\/)?(www\.)?sticker\.ly\/s\/[a-zA-Z0-9]+$/i.test(url)
}

// Función para validar si la respuesta es JSON válido
const validateJsonResponse = (data, endpoint) => {
  // Si es buffer o string binario, no es JSON
  if (Buffer.isBuffer(data) || (typeof data === 'string' && data.charCodeAt(0) === 0x8950 && data.charCodeAt(1) === 0x4E47)) {
    throw new Error(`La API ${endpoint} devolvió una imagen en lugar de JSON`)
  }
  
  // Si data es string y parece ser HTML
  if (typeof data === 'string' && (data.includes('<!DOCTYPE') || data.includes('<html'))) {
    throw new Error(`La API ${endpoint} devolvió HTML en lugar de JSON`)
  }
  
  return data
}

// BUSCADOR
const searchPacks = async (query, attempt = 1) => {
  try {
    const response = await axios.get(
      'https://api.delirius.store/search/stickerly',
      {
        params: { query },
        timeout: 15000,
        responseType: 'text' // Recibir como texto primero para validar
      }
    )
    
    // Validar que sea JSON antes de parsear
    const data = validateJsonResponse(response.data, '/search/stickerly')
    
    // Intentar parsear JSON
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data
    
    return parsedData

  } catch (e) {
    if (e.response?.status === 429 && attempt <= 3) {
      await delay(5000)
      return searchPacks(query, attempt + 1)
    }
    
    // Si el error es por JSON inválido
    if (e.message?.includes('devolvió una imagen') || e.message?.includes('Unexpected token')) {
      console.error('Error: La API no devolvió JSON válido en search/stickerly')
      throw new Error('La API cambió su formato de respuesta')
    }
    
    throw e
  }
}

// DESCARGA
const downloadPack = async (url, attempt = 1) => {
  try {
    const response = await axios.get(
      'https://api.delirius.store/download/stickerly',
      {
        params: { url },
        timeout: 15000,
        responseType: 'text' // Recibir como texto primero
      }
    )
    
    // Validar que sea JSON
    const data = validateJsonResponse(response.data, '/download/stickerly')
    
    // Intentar parsear JSON
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data
    
    return parsedData

  } catch (e) {
    if (e.response?.status === 429 && attempt <= 3) {
      await delay(5000)
      return downloadPack(url, attempt + 1)
    }
    
    // Manejar error de JSON inválido
    if (e.message?.includes('devolvió una imagen') || e.message?.includes('Unexpected token')) {
      console.error('Error: La API no devolvió JSON válido en download/stickerly')
      
      // Intentar una vez más con responseType buffer por si acaso
      try {
        const bufferResponse = await axios.get(
          'https://api.delirius.store/download/stickerly',
          {
            params: { url },
            timeout: 15000,
            responseType: 'arraybuffer'
          }
        )
        
        // Verificar si es PNG/JPEG
        const buffer = bufferResponse.data
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8
        
        if (isPNG || isJPEG) {
          throw new Error('La API ahora devuelve imágenes directamente. Este endpoint ya no es compatible.')
        }
      } catch (fallbackError) {
        throw new Error('No se pudo obtener datos del pack')
      }
    }
    
    throw e
  }
}

const filterRelevantPacks = (packs, query) => {
  const searchTerm = query.toLowerCase().trim()
  if (!searchTerm) return packs
  
  return packs.filter(pack => {
    const packName = (pack.title || pack.name || '').toLowerCase()
    return packName.includes(searchTerm)
  })
}

export default {
  command: ['stickerpack', 'spack'],
  category: 'stickers',

  run: async (sock, m, args) => {
    try {
      const text = args.join(' ')

      if (!text) {
        return m.reply('《✧》 Ingresa el nombre del pack o una URL de sticker.ly')
      }

      let packData

      const stickerMatch = text.match(/(?:sticker\.ly\/s\/)([a-zA-Z0-9]+)(?:\s|$)/)
      const url = stickerMatch ? 'https://sticker.ly/s/' + stickerMatch[1] : (isStickerUrl(text) ? text : null)

      // URL DIRECTA
      if (url) {
        await m.reply('《✧》 Descargando pack de stickers...')
        const detail = await downloadPack(url)
        const data = detail.data || detail

        if (!data || !data.stickers?.length) {
          return m.reply('《✧》 El pack no está disponible.')
        }

        packData = data

      } else {
        await m.reply(`《✧》 Buscando packs: ${text}...`)
        
        const search = await searchPacks(text)
        const results = search.data || search.result || []

        if (!results.length) {
          return m.reply(`《✧》 No se encontraron packs para *${text}*.`)
        }

        const relevantPacks = filterRelevantPacks(results, text)
        const packsToTry = relevantPacks.length > 0 ? relevantPacks : results

        let detail = null
        let intentos = 0
        const maxIntentos = Math.min(packsToTry.length, 5)

        while (intentos < maxIntentos && !detail) {
          const random = packsToTry[Math.floor(Math.random() * packsToTry.length)]
          
          try {
            const res = await downloadPack(random.url || random.link)
            const data = res.data || res

            if (data?.stickers?.length > 0) {
              detail = data
              break
            }
          } catch (packError) {
            console.log(`Error con pack ${intentos + 1}:`, packError.message)
          }
          
          intentos++
        }

        if (!detail) {
          return m.reply('《✧》 No se pudo descargar ningún pack válido.')
        }

        packData = detail
      }

      const { title, author, stickers } = packData

      if (!stickers?.length) {
        return m.reply('《✧》 El pack no contiene stickers válidos.')
      }

      const MAX_STICKERS = 30
      const selectedStickers = stickers.slice(0, MAX_STICKERS)

      await sock.sendMessage(
        m.chat,
        {
          stickerPack: {
            name: title || 'Sticker Pack',
            publisher: author || 'Sticker.ly',
            description: 'Sᴛɪᴄᴋᴇʀ Pᴀᴄᴋ',
            stickers: selectedStickers.map(s => ({
              url: s.url || s.imageUrl || s.download,
              isAnimated: s.isAnimated || false,
              emojis: ['🎭']
            }))
          }
        },
        { quoted: m }
      )

    } catch (e) {
      console.error('Error completo:', e)
      
      // Mensajes de error más descriptivos
      if (e.message?.includes('devolvió una imagen')) {
        return m.reply('《✧》 La API cambió su formato. El servicio de sticker packs no está disponible temporalmente.')
      }
      
      if (e.message?.includes('Unexpected token')) {
        return m.reply('《✧》 Error en la respuesta de la API. Intenta de nuevo más tarde.')
      }
      
      return m.reply('《✧》 Error al descargar el pack.')
    }
  }
}
