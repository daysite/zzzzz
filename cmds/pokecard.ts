import fetch from 'node-fetch'

export default {
  command: ['pokecard', 'pokemoncard'],
  category: 'internet',

  run: async (sock, m, args) => {

    try {

      if (!args[0]) {
        return m.reply(
          '✿ Ingresa un Pokémon.\n\nEjemplo:\n.pokecard charizard'
        )
      }

      const text = args.join(' ')

      await m.reply('✿ Buscando carta Pokémon...')

      const apiUrl =
        `https://api.delirius.store/search/pokecard?text=${encodeURIComponent(text)}`

      const response =
        await fetch(apiUrl)

      const res =
        await response.json()

      console.log(res)

      const data =
        res.data || res

      const image =
        data.image ||
        data.img ||
        data.url

      if (!image) {
        return m.reply(
          '✿ No se encontró ninguna carta.'
        )
      }

      await sock.sendMessage(
        m.chat,
        {
          image: {
            url: image
          },

          caption:
`╭─〔 POKÉCARD 〕─⬣

✦ Pokémon › ${data.name || text}

╰────────────────⬣`
        },
        { quoted: m }
      )

    } catch (e) {

      console.log(e)

      return m.reply(
        '✿ Error al usar la API.'
      )
    }
  }
}
