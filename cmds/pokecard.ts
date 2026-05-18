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
      await m.reply(`《✧》 Buscando carta Pokémon de: ${text}`)

      // URL de la API (sin http, ya que fetch usa https por defecto si la URL es relativa)
      const apiUrl = `https://api.delirius.store/search/pokecard?text=${encodeURIComponent(text)}`
      const response = await fetch(apiUrl)
      const res = await response.json()

      console.log(JSON.stringify(res, null, 2))

      // La API devuelve un objeto con propiedad 'data' que contiene la imagen en 'image_url'
      const image = res.data?.image_url || res.data?.image || res.image

      if (!image) {
        return m.reply('《✧》 No se encontró la carta Pokémon.')
      }

      // Extraer información adicional si está disponible en res.data
      const nombre = res.data?.name || text
      const tipo = res.data?.type || 'Desconocido'
      const hp = res.data?.hp || '???'

      await sock.sendMessage(
        m.chat,
        {
          image: { url: image },
          caption: `╭─〔 POKÉMON CARD 〕─⬣\n\nNombre:\n${nombre}\n\nTipo:\n${tipo}\n\nHP:\n${hp}\n\n╰────────────────⬣`
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Error al buscar la carta Pokémon.')
    }
  }
}
