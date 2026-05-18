import fetch from 'node-fetch'

export default {
  command: ['pokecard', 'pokemoncard'],
  category: 'imagenes',

  run: async (sock, m, args) => {
    try {

      if (!args[0]) {
        return m.reply(
          '《✧》 Ingresa el nombre de un Pokémon.\n\nEjemplo:\n.pokecard charizard'
        )
      }

      const text = args.join(' ')

      await m.reply(
        `《✧》 Buscando carta Pokémon de: ${text}`
      )

      const apiUrl =
        `http://api.delirius.store/search/pokecard?text=${encodeURIComponent(text)}`

      const response =
        await fetch(apiUrl)

      const res =
        await response.json()

      console.log(JSON.stringify(res, null, 2))

      const data =
        res.data || res

      const image =
        data.image ||
        data.img ||
        data.url

      if (!image) {
        return m.reply(
          '《✧》 No se encontró la carta Pokémon.'
        )
      }

      const nombre =
        data.name ||
        text

      const tipo =
        data.type ||
        'Desconocido'

      const hp =
        data.hp ||
        '???'

      await sock.sendMessage(
        m.chat,
        {
          image: { url: image },

          caption:
`╭─〔 POKÉMON CARD 〕─⬣

Nombre:
${nombre}

Tipo:
${tipo}

HP:
${hp}

╰────────────────⬣`
        },
        { quoted: m }
      )

    } catch (e) {

      console.log(e)

      return m.reply(
        '《✧》 Error al buscar la carta Pokémon.'
      )
    }
  }
}
