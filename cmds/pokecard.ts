import fetch from 'node-fetch'
import { getBuffer } from '../../core/message.ts'

export default {
  command: ['pokecard', 'pokemoncard'],
  category: 'internet',

  run: async (sock, m, args) => {

    try {

      if (!args || !args[0]) {
        return m.reply(
          '✿ Ingresa el nombre de un Pokémon.\n\nEjemplo:\n.pokecard charizard'
        )
      }

      await m.reply(mess.wait)

      const text = args.join(' ')

      const apiUrl =
        `https://api.delirius.store/search/pokecard?text=${encodeURIComponent(text)}`

      const response =
        await fetch(apiUrl)

      const res =
        await response.json()

      console.log(JSON.stringify(res, null, 2))

      const result =
        res.data || res.result || res

      // DETECTAR IMAGEN
      const image =
        result.image ||
        result.img ||
        result.url

      if (!image) {
        return m.reply(
          '✿ No se encontró ninguna carta Pokémon.'
        )
      }

      const buffer =
        await getBuffer(image)

      const caption =
`╭─〔 POKÉMON CARD 〕─⬣

✦ Nombre › ${result.name || text}

✧ Tipo › ${result.type || 'Desconocido'}

✪ HP › ${result.hp || '???'}

❍ Rareza › ${result.rarity || 'Desconocida'}

╰────────────────⬣`

      await sock.sendMessage(
        m.chat,
        {
          image: buffer,
          caption
        },
        { quoted: m }
      )

    } catch (e) {

      console.log(e)

      return m.reply(
        '✿ Ocurrió un error al buscar la carta.'
      )
    }
  }
}
