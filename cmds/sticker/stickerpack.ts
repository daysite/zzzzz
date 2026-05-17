import axios from 'axios'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const key = api.key

const isStickerUrl = (url) => {
  return /^(https?:\/\/)?(www\.)?sticker\.ly\/s\/[a-zA-Z0-9]+$/i.test(url)
}

// BUSCADOR
const searchPacks = async (query, attempt = 1) => {
  try {
    const { data } = await axios.get(
      'https://api.delirius.store/search/stickerly',
      {
        params: { query },
        timeout: 15000
      }
    )

    return data

  } catch (e) {
    if (e.response?.status === 429 && attempt <= 3) {
      await delay(5000)
      return searchPacks(query, attempt + 1)
    }

    throw e
  }
}

// DESCARGA
const downloadPack = async (url, attempt = 1) => {
  try {
    const { data } = await axios.get(
      'https://api.delirius.store/download/stickerly',
      {
        params: { url },
        timeout: 15000
      }
    )

    return data

  } catch (e) {
    if (e.response?.status === 429 && attempt <= 3) {
      await delay(5000)
      return downloadPack(url, attempt + 1)
    }

    throw e
  }
}

const filterRelevantPacks = (packs, query) => {
  const searchTerm = query.toLowerCase().trim()

  if (!searchTerm) return packs

  return packs.filter(pack => {
    const packName =
      (pack.title || pack.name || '')
        .toLowerCase()

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
        return m.reply(
          '《✧》 Ingresa el nombre del pack o una URL de sticker.ly'
        )
      }

      let packData

      const stickerMatch =
        text.match(/(?:sticker\.ly\/s\/)([a-zA-Z0-9]+)(?:\s|$)/)

      const url =
        stickerMatch
          ? 'https://sticker.ly/s/' + stickerMatch[1]
          : (isStickerUrl(text) ? text : null)

      // URL DIRECTA
      if (url) {

        await m.reply('《✧》 Descargando pack de stickers...')

        const detail = await downloadPack(url)

        const data = detail.data || detail

        if (!data || !data.stickers?.length) {
          return m.reply(
            '《✧》 El pack no está disponible.'
          )
        }

        packData = data

      } else {

        await m.reply(`《✧》 Buscando packs: ${text}...`)

        const search = await searchPacks(text)

        const results =
          search.data ||
          search.result ||
          []

        if (!results.length) {
          return m.reply(
            `《✧》 No se encontraron packs para *${text}*.`
          )
        }

        const relevantPacks =
          filterRelevantPacks(results, text)

        const packsToTry =
          relevantPacks.length > 0
            ? relevantPacks
            : results

        let detail = null
        let intentos = 0

        const maxIntentos =
          Math.min(packsToTry.length, 5)

        while (
          intentos < maxIntentos &&
          !detail
        ) {

          const random =
            packsToTry[
              Math.floor(Math.random() * packsToTry.length)
            ]

          const res =
            await downloadPack(
              random.url || random.link
            )

          const data = res.data || res

          if (data?.stickers?.length > 0) {
            detail = data
            break
          }

          intentos++
        }

        if (!detail) {
          return m.reply(
            '《✧》 No se pudo descargar ningún pack válido.'
          )
        }

        packData = detail
      }

      const {
        title,
        author,
        stickers
      } = packData

      if (!stickers?.length) {
        return m.reply(
          '《✧》 El pack no contiene stickers válidos.'
        )
      }

      const MAX_STICKERS = 30

      const selectedStickers =
        stickers.slice(0, MAX_STICKERS)

      await sock.sendMessage(
        m.chat,
        {
          stickerPack: {
            name: title || 'Sticker Pack',

            publisher:
              author ||
              'Sticker.ly',

            description:
              'Sᴛɪᴄᴋᴇʀ Pᴀᴄᴋ',

            stickers:
              selectedStickers.map(s => ({
                url:
                  s.url ||
                  s.imageUrl ||
                  s.download,

                isAnimated:
                  s.isAnimated || false,

                emojis: ['🎭']
              }))
          }
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)

      return m.reply(
        '《✧》 Error al descargar el pack.'
      )
    }
  }
}
