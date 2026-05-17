export default {
  command: ['soundcloud', 'sc'],
  category: 'descargas',

  run: async (sock, m, args) => {
    try {
      const url = args[0]

      if (!url) {
        return m.reply('《✤》 Ingresa un link de SoundCloud')
      }

      await m.reply('《✤》 Descargando audio de SoundCloud...')

      const api = `https://api.delirius.store/download/soundcloud?url=${encodeURIComponent(url)}`

      const response = await fetch(api)
      const data = await response.json()

      if (!data?.status || !data?.data?.download) {
        return m.reply('《✤》 No se pudo descargar el audio')
      }

      const {
        title,
        artist,
        image,
        download
      } = data.data

      await sock.sendMessage(
        m.chat,
        {
          image: { url: image },
          caption:
`╭─〔 🎵 SOUND CLOUD 〕─⬣
│
│ 📌 Título: ${title || 'Desconocido'}
│ 👤 Autor: ${artist || 'Desconocido'}
│
╰────────────────⬣`
        },
        { quoted: m }
      )

      return sock.sendMessage(
        m.chat,
        {
          audio: { url: download },
          mimetype: 'audio/mp4',
          fileName: `${title || 'soundcloud'}.mp3`
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)
      return m.reply(msgglobal)
    }
  }
}
