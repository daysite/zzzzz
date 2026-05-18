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

      // URL de la API (la API devuelve directamente la imagen)
      const apiUrl = `https://api.delirius.store/search/pokecard?text=${encodeURIComponent(text)}`
      
      // Hacer la petición
      const response = await fetch(apiUrl)

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Verificar el tipo de contenido
      const contentType = response.headers.get('content-type')
      
      // Si es JSON, intentar extraer la imagen (por si cambia la API)
      if (contentType && contentType.includes('application/json')) {
        const res = await response.json()
        const image = res.data?.image_url || res.data?.image || res.image || res.url
        
        if (!image) {
          return m.reply('《✧》 No se encontró la carta Pokémon.')
        }
        
        // Enviar la imagen desde la URL extraída
        await sock.sendMessage(
          m.chat,
          {
            image: { url: image },
            caption: `╭─〔 POKÉMON CARD 〕─⬣\n\n《✧》 Pokémon: ${text.toUpperCase()}\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      } 
      // Si es imagen, enviar directamente el buffer
      else if (contentType && contentType.includes('image/')) {
        const imageBuffer = await response.buffer()
        
        await sock.sendMessage(
          m.chat,
          {
            image: imageBuffer,
            caption: `╭─〔 POKÉMON CARD 〕─⬣\n\n《✧》 Pokémon: ${text.toUpperCase()}\n\n╰────────────────⬣`
          },
          { quoted: m }
        )
      }
      else {
        throw new Error(`Tipo de contenido no soportado: ${contentType}`)
      }

    } catch (e) {
      console.error('Error:', e)
      return m.reply('《✧》 Error al buscar la carta Pokémon. Intenta con otro nombre.')
    }
  }
}
