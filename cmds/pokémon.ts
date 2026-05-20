import fetch from 'node-fetch'

export default {
  command: ['cazar', 'pokemon', 'atrapar', 'capturar'],
  category: 'games',

  // Almacenar datos de usuarios (en producción usa una base de datos)
  userData: new Map(),

  run: async (sock, m, args) => {
    try {
      const userId = m.sender
      const subcommand = args[0]?.toLowerCase()
      
      // Inicializar o obtener datos del usuario
      let user = global.pokemonUsers?.get(userId) || {
        pokemones: [],
        pokeballs: 5,
        coins: 100,
        lastCatch: 0
      }
      
      // === VER INVENTARIO ===
      if (subcommand === 'mochila' || subcommand === 'inv') {
        return m.reply(
          `╭─〔 INVENTARIO 〕─⬣\n\n` +
          `🎯 Pokeballs: ${user.pokeballs}\n` +
          `🪙 Monedas: ${user.coins}\n` +
          `📦 Pokémon: ${user.pokemones.length}\n\n` +
          `╰────────────────⬣`
        )
      }
      
      // === VER MIS POKÉMON ===
      if (subcommand === 'lista' || subcommand === 'pokedex') {
        if (user.pokemones.length === 0) {
          return m.reply('《📭》 Aún no tienes Pokémon. Usa *!cazar* para encontrar tu primero.')
        }
        
        let lista = `╭─〔 MIS POKÉMON 〕─⬣\n\n`
        user.pokemones.forEach((p, i) => {
          lista += `${i+1}. ${p.nombre} | ❤️ ${p.hp || '??'}\n   ⭐ ${p.xp || 0} XP\n\n`
        })
        lista += `╰────────────────⬣`
        
        return m.reply(lista)
      }
      
      // === COMPRAR POKEBALLS ===
      if (subcommand === 'comprar' && args[1]) {
        const cantidad = parseInt(args[1])
        if (isNaN(cantidad) || cantidad < 1) {
          return m.reply('《✧》 Cantidad inválida. Ejemplo: *!pokemon comprar 5*')
        }
        
        const precioTotal = cantidad * 20 // 20 monedas cada Pokeball
        
        if (user.coins < precioTotal) {
          return m.reply(`《❌》 No tienes suficientes monedas. Necesitas ${precioTotal}🪙 (tienes ${user.coins}🪙)`)
        }
        
        user.coins -= precioTotal
        user.pokeballs += cantidad
        
        global.pokemonUsers.set(userId, user)
        
        return m.reply(`《✅》 Compraste ${cantidad} Pokeball(s) por ${precioTotal}🪙\n🎯 Total Pokeballs: ${user.pokeballs}`)
      }
      
      // === COMANDO PRINCIPAL: CAZAR ===
      // Verificar cooldown (30 segundos)
      const cooldown = 30 * 1000
      const timeSinceLastCatch = Date.now() - (user.lastCatch || 0)
      
      if (timeSinceLastCatch < cooldown) {
        const remaining = Math.ceil((cooldown - timeSinceLastCatch) / 1000)
        return m.reply(`《⏳》 Espera ${remaining} segundos antes de cazar otro Pokémon.`)
      }
      
      if (user.pokeballs < 1) {
        return m.reply(
          '《🎯》 No tienes Pokeballs.\n\n' +
          'Usa *!pokemon comprar <cantidad>* para comprar más.\n' +
          'Ganas monedas al capturar Pokémon.'
        )
      }
      
      await m.reply('《🌿》 Buscando un Pokémon salvaje...')
      
      // === GENERAR POKÉMON ALEATORIO ===
      // La PokeAPI tiene 1025 Pokémon disponibles [citation:3][citation:10]
      const randomId = Math.floor(Math.random() * 1025) + 1
      
      // Obtener datos del Pokémon desde la API
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomId}`)
      const pokemonData = await response.json()
      
      // Obtener nombre en español
      const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomId}`)
      const speciesData = await speciesResponse.json()
      
      const nombreEspanol = speciesData.names.find(n => n.language.name === 'es')?.name || pokemonData.name
      const tipos = pokemonData.types.map(t => t.type.name)
      const tiposEsp = tipos.map(t => {
        const tiposMap = {
          normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
          grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
          ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
          rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
          steel: 'Acero', fairy: 'Hada'
        }
        return tiposMap[t] || t
      })
      
      // Calcular rareza y tasa de captura
      let rarity, catchRate, xpGanado, coinsGanado
      const baseXP = pokemonData.base_experience || 100
      
      if (randomId <= 151) {
        rarity = '🌟 Común'
        catchRate = 0.6
        xpGanado = baseXP
        coinsGanado = 20
      } else if (randomId <= 251) {
        rarity = '✨ Poco Común'
        catchRate = 0.5
        xpGanado = baseXP + 20
        coinsGanado = 30
      } else if (randomId <= 386) {
        rarity = '💎 Raro'
        catchRate = 0.35
        xpGanado = baseXP + 50
        coinsGanado = 50
      } else if (randomId <= 493) {
        rarity = '🔮 Muy Raro'
        catchRate = 0.25
        xpGanado = baseXP + 80
        coinsGanado = 80
      } else {
        rarity = '👑 Legendario'
        catchRate = 0.15
        xpGanado = baseXP + 150
        coinsGanado = 150
      }
      
      // Obtener imagen oficial
      const imagenUrl = pokemonData.sprites.other['official-artwork'].front_default || 
                       pokemonData.sprites.front_default
      
      // Mostrar el Pokémon encontrado
      const pokemonInfo = `╭─〔 POKÉMON SALVAJE 〕─⬣\n\n` +
        `📛 *${nombreEspanol}*\n` +
        `🔢 #${randomId.toString().padStart(4, '0')}\n` +
        `⚡ Tipo: ${tiposEsp.join(', ')}\n` +
        `💎 Rareza: ${rarity}\n` +
        `📊 XP Base: ${baseXP}\n\n` +
        `╰────────────────⬣\n\n` +
        `¿Quieres intentar capturarlo?\n` +
        `Responde con *"si"* o *"no"* (15 segundos)`
      
      await sock.sendMessage(m.chat, {
        image: { url: imagenUrl },
        caption: pokemonInfo
      }, { quoted: m })
      
      // Guardar estado de la captura
      const catchState = {
        active: true,
        pokemon: {
          id: randomId,
          nombre: nombreEspanol,
          xp: xpGanado,
          coins: coinsGanado,
          image: imagenUrl
        },
        catchRate,
        userId,
        timestamp: Date.now()
      }
      
      global.activeCatches = global.activeCatches || new Map()
      global.activeCatches.set(userId, catchState)
      
      // Esperar respuesta (15 segundos)
      const responseTimeout = setTimeout(() => {
        if (global.activeCatches?.get(userId)?.active) {
          global.activeCatches.delete(userId)
          sock.sendMessage(m.chat, { text: '《⌛》 Tiempo agotado. El Pokémon huyó.' }, { quoted: m })
        }
      }, 15000)
      
      catchState.timeout = responseTimeout
      
      // Escuchar respuesta
      const responseListener = async (msg) => {
        if (msg.key && msg.key.participant === userId && msg.message?.conversation) {
          const respuesta = msg.message.conversation.toLowerCase().trim()
          
          if (respuesta === 'si' && global.activeCatches.get(userId)?.active) {
            clearTimeout(catchState.timeout)
            global.activeCatches.delete(userId)
            
            // Intentar captura
            const random = Math.random()
            const exito = random <= catchRate
            
            if (exito) {
              // Pokémon capturado
              user.pokeballs--
              user.pokemones.push({
                id: randomId,
                nombre: nombreEspanol,
                xp: 0,
                nivel: 1
              })
              user.coins += coinsGanado
              user.lastCatch = Date.now()
              
              global.pokemonUsers = global.pokemonUsers || new Map()
              global.pokemonUsers.set(userId, user)
              
              await sock.sendMessage(m.chat, {
                image: { url: imagenUrl },
                caption: `╭─〔 CAPTURA EXITOSA 〕─⬣\n\n` +
                  `🎉 ¡Atrapaste a *${nombreEspanol}*!\n` +
                  `📊 +${xpGanado} XP\n` +
                  `🪙 +${coinsGanado} monedas\n\n` +
                  `╰────────────────⬣`
              }, { quoted: m })
              
            } else {
              // Pokémon huye
              user.pokeballs-- // Gastas la Pokeball igual
              user.lastCatch = Date.now()
              
              global.pokemonUsers.set(userId, user)
              
              await sock.sendMessage(m.chat, {
                image: { url: imagenUrl },
                caption: `╭─〔 CAPTURA FALLIDA 〕─⬣\n\n` +
                  `😭 *${nombreEspanol}* logró escapar...\n` +
                  `🎯 Te queda(n) ${user.pokeballs} Pokeball(s)\n\n` +
                  `╰────────────────⬣`
              }, { quoted: m })
            }
          }
          
          if (respuesta === 'no' && global.activeCatches.get(userId)?.active) {
            clearTimeout(catchState.timeout)
            global.activeCatches.delete(userId)
            
            await m.reply(`《🏃》 Dejaste ir a *${nombreEspanol}*. Quizás la próxima vez...`)
          }
          
          sock.ev.off('messages.upsert', responseListener)
        }
      }
      
      sock.ev.on('messages.upsert', responseListener)
      
    } catch (error) {
      console.error('Error:', error)
      m.reply('《✧》 Error al cazar Pokémon. Intenta de nuevo.')
    }
  }
}
