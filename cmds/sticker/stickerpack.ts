import fetch from 'node-fetch'

export default {
  command: ['stickerly', 'stickers'],
  category: 'downloader',

  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》 Ingresa el nombre del pack de stickers')
      }

      const query = args.join(' ')

      await m.reply(`《✧》 Buscando pack: ${query}...`)

      // BUSCADOR
      const searchUrl = `https://api.delirius.store/search/stickerly?query=${encodeURIComponent(query)}`
      const searchRes = await fetch(searchUrl)
      const searchJson = await searchRes.json()

      console.log(JSON.stringify(searchJson, null, 2))

      const results = searchJson.data || searchJson.result || []

      if (!results.length) {
        return m.reply('《✧》 No se encontraron packs.')
      }

      // PACK ALEATORIO
      const random = results[Math.floor(Math.random() * results.length)]

      const title = random.title || 'Sticker Pack'
      const author = random.author || random.publisher || 'Desconocido'
      const thumb = random.image || random.thumbnail
      const link = random.url || random.link

      if (!link) {
        return m.reply('《✧》 No se encontró el enlace del pack.')
      }

      await sock.sendMessage(
        m.chat,
        {
          image: { url: thumb },
          caption: `➥ Pack encontrado › ${title}

> ✿⃘࣪◌ ֪ Autor › ${author}
> ✿⃘࣪◌ ֪ Plataforma › Sticker.ly

𐙚 ❀ ｡ ↻ Descargando stickers... ˙𐙚`
        },
        { quoted: m }
      )

      // DESCARGA
      const apiUrl = `https://api.delirius.store/download/stickerly?url=${encodeURIComponent(link)}`
      const response = await fetch(apiUrl)
      const res = await response.json()

      console.log(JSON.stringify(res, null, 2))

      const data = res.data || res
      const stickers = data.stickers || []

      if (!stickers.length) {
        return m.reply('《✧》 No se pudieron descargar los stickers.')
      }

      for (const sticker of stickers) {
        const stickerUrl =
          sticker.url ||
          sticker.download ||
          sticker

        if (!stickerUrl) continue

        await sock.sendMessage(
          m.chat,
          {
            sticker: { url: stickerUrl }
          },
          { quoted: m }
        )
      }

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Error al descargar el pack.')
    }
  }
}
