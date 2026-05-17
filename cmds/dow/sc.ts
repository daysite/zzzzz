import fetch from 'node-fetch'

export default {
  command: ['soundcloud', 'sc'],
  category: 'downloader',

  run: async (sock, m, args) => {
    try {
      if (!args[0]) {
        return m.reply('《✧》Por favor, ingresa un enlace de SoundCloud')
      }

      const url = args[0]

      await m.reply('《✧》 Descargando audio de SoundCloud...')

      const apiUrl = `https://api.delirius.store/download/soundcloud?url=${encodeURIComponent(url)}`

      const response = await fetch(apiUrl)
      const res = await response.json()

      console.log(res)

      if (!res?.data) {
        return m.reply('《✧》 No se pudo descargar el audio')
      }

      const title = res.data.title || 'SoundCloud Audio'
      const author = res.data.author || 'Desconocido'
      const thumbnail = res.data.image
      const audio = res.data.download?.url || res.data.download

      if (!audio) {
        return m.reply('《✧》 El enlace de descarga no fue encontrado')
      }

      await sock.sendMessage(
        m.chat,
        {
          image: { url: thumbnail },
          caption: `➥ Descargando › ${title}

> ✿⃘࣪◌ ֪ Autor › ${author}
> ✿⃘࣪◌ ֪ Plataforma › SoundCloud
> ✿⃘࣪◌ ֪ Enlace › ${url}

𐙚 ❀ ｡ ↻ El archivo se está enviando, espera un momento... ˙𐙚`
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
      return m.reply('《✧》 Ocurrió un error al descargar el audio')
    }
  }
} 
