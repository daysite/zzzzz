import fetch from 'node-fetch'

export default {
  command: ['soundcloud', 'sc'],
  category: 'downloader',

  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》 Ingresa un link de SoundCloud')
      }

      const url = args[0]

      await m.reply('《✧》 Descargando audio de SoundCloud...')

      const apiUrl = `https://api.delirius.store/download/soundcloud?url=${encodeURIComponent(url)}`

      const response = await fetch(apiUrl)
      const res = await response.json()

      console.log(JSON.stringify(res, null, 2))

      const data = res.data || res

      const title = data.title || 'SoundCloud Audio'
      const author = data.author || 'Desconocido'
      const thumbnail = data.image || data.thumbnail
      const audio =
        data.download?.url ||
        data.download ||
        data.dl

      if (!audio) {
        return m.reply('《✧》 La API no devolvió el audio.')
      }

      await sock.sendMessage(
        m.chat,
        {
          image: { url: thumbnail },
          caption: `➥ Descargando › ${title}

> ✿⃘࣪◌ ֪ Autor › ${author}
> ✿⃘࣪◌ ֪ Plataforma › SoundCloud

𐙚 ❀ ｡ ↻ Enviando audio... ˙𐙚`
        },
        { quoted: m }
      )

      await sock.sendMessage(
        m.chat,
        {
          audio: { url: audio },
          mimetype: 'audio/mpeg',
          fileName: `${title}.mp3`
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Error al descargar el audio.')
    }
  }
}
