import fetch from 'node-fetch'

export default {
  command: ['soundcloud', 'sc'],
  category: 'downloader',

  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》 Ingresa una búsqueda de SoundCloud')
      }

      const query = args.join(' ')
      await m.reply(`《✧》 Buscando en SoundCloud: ${query}...`)

      const searchUrl = `https://api.delirius.store/search/soundcloud?q=${encodeURIComponent(query)}`
      const searchRes = await fetch(searchUrl)
      const searchJson = await searchRes.json()

      const results = searchJson.data
      if (!results || results.length === 0) {
        return m.reply('《✧》 No se encontraron resultados.')
      }

      const random = results[Math.floor(Math.random() * results.length)]

      const title = random.title || 'SoundCloud Audio'
      const author = random.artist || 'Desconocido'
      const thumbnail = random.image || random.thumbnail
      const link = random.link

      await m.reply(`《✧》 Descargando audio: ${title}`)

      const apiUrl = `https://api.delirius.store/download/soundcloud?url=${encodeURIComponent(link)}`
      const response = await fetch(apiUrl)
      const res = await response.json()

      const data = res.data || res
      const audio = data.download

      if (!audio) {
        return m.reply('《✧》 La API no devolvió el audio.')
      }

      await sock.sendMessage(
        m.chat,
        {
          image: { url: data.image || thumbnail },
          caption: `➥ Descargando › ${data.title}

> ✿⃘࣪◌ ֪ Autor › ${data.author}
> ✿⃘࣪◌ ֪ Plataforma › SoundCloud
> ✿⃘࣪◌ ֪ Likes › ${data.likes}
> ✿⃘࣪◌ ֪ Reproducciones › ${data.playbacks}

𐙚 ❀ ｡ ↻ Enviando audio... ˙𐙚`
        },
        { quoted: m }
      )

      await sock.sendMessage(
        m.chat,
        {
          audio: { url: audio },
          mimetype: 'audio/mpeg',
          fileName: `${data.title}.mp3`
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Error al descargar el audio.')
    }
  }
}