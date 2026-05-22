import fetch from 'node-fetch'

export default {
  command: ['hola', 'hello', 'hi'],
  category: 'general',

  // Lista de stickers de saludo (URLs de stickers animados y estáticos)
  stickerSaludos: [
    'https://media.tenor.com/GxSxTtXxXxQAAAAi/pikachu-hola.gif',
    'https://media.tenor.com/5oYxXxXxXxQAAAAi/anime-wave.gif',
    'https://media.tenor.com/3xXxXxXxXxQAAAAi/hello-sticker.gif',
    'https://i.pinimg.com/originals/8b/16/0a/8b160ae1d13f5bda98c9f6a7640ff47b.gif',
    'https://media.tenor.com/rxXxXxXxXxQAAAAi/cat-hello.gif',
    'https://media.tenor.com/7xXxXxXxXxQAAAAi/anime-hello.gif'
  ],

  // Lista de saludos variados (SOLO UNO menciona a Nao)
  saludos: [
    {
      titulo: "👋 SALUDO CÁLIDO",
      mensaje: `¡Hola! ¿Cómo estás?

Soy el asistente de este grupo.
Creado por *Daniel* 🧑‍💻

¿En qué puedo ayudarte hoy?`
    },
    {
      titulo: "✨ BIENVENIDA",
      mensaje: `¡Hey! Qué gusto verte por aquí.

Mi creador *Daniel* me trajo a la vida.
Estoy listo para lo que necesites.`
    },
    {
      titulo: "🌟 PRESENTACIÓN",
      mensaje: `Permíteme presentarme:

📌 *Nombre:* Asistente Virtual
👨‍💻 *Creador:* Daniel
🔧 *Estado:* Activo y funcionando

¡Un placer saludarte!`
    },
    {
      titulo: "💫 BUEN DÍA",
      mensaje: `¡Buenos días! ☀️

Que tengas un lindo día.
Estoy aquí para ayudarte siempre.`
    },
    {
      titulo: "🌙 BUENAS NOCHES",
      mensaje: `Buenas noches 🌙

*Daniel* me mandó a decirte que descanses.
¿Necesitas algo antes de dormir?`
    },
    {
      titulo: "🎉 SALUDO ALEGRE",
      mensaje: `¡Wii! ¡Qué emoción saludarte! 🎊

Soy el bot creado por *Daniel*
especialmente arreglado para nao ❤️
¡Vamos a divertirnos!`
    },
    {
      titulo: "🤖 SALUDO ROBÓTICO",
      mensaje: `*SISTEMA ACTIVADO* 🔌

Usuario: {nombre}
Creador: Daniel
Estado: 100% operativo

*COMANDOS DISPONIBLES* 📟
.pokemon - Juego de Pokémon
.sticker - Crear stickers
.yta / ytv - Descargar multimedia

*FIN DEL MENSAJE* 🔚`
    },
    {
      titulo: "💝 SALUDO ESPECIAL",
      mensaje: `Hola, hermosa/o 💕

Este mensaje viene con mucho amor.
*Daniel* me creó y principalmente me arregló para ti, *Nao* ❤️

Espero que tengas un día tan especial como tú.`
    },
    {
      titulo: "🐱 SALUDO GATUNO",
      mensaje: `¡Miau! 😺

El bot de *Daniel* te saluda.
¿Necesitas algo?`
    },
    {
      titulo: "🍵 SALUDO RELAJADO",
      mensaje: `Tómate un respiro ☕

*Daniel* me envió a saludarte.
Relájate y dime en qué te ayudo.`
    }
  ],

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      
      // Elegir un saludo ALEATORIO de la lista
      const randomIndex = Math.floor(Math.random() * this.saludos.length)
      const saludoElegido = this.saludos[randomIndex]
      
      // Elegir un sticker aleatorio
      const stickerUrl = this.stickerSaludos[Math.floor(Math.random() * this.stickerSaludos.length)]
      
      // Reemplazar placeholder del nombre si existe
      let mensajeFinal = saludoElegido.mensaje
      mensajeFinal = mensajeFinal.replace('{nombre}', nombreUsuario)
      
      // Construir el mensaje completo con formato
      const mensajeCompleto = `╭─〔 ${saludoElegido.titulo} 〕─⬣
      
${mensajeFinal}

━━━━━━━━━━━━━━━━━━━━━

🎯 *Comandos rápidos:*
.pokemon - Captura Pokémon
.sticker - Crea stickers
.menu - Ver todos

╰────────────────⬣`
      
      // === ENVIAR STICKER ===
      if (stickerUrl) {
        try {
          const isGif = stickerUrl.includes('.gif') || stickerUrl.includes('tenor.com')
          const response = await fetch(stickerUrl)
          const buffer = await response.buffer()
          
          await sock.sendMessage(m.chat, {
            sticker: buffer,
            ...(isGif && { mimetype: 'image/gif' })
          }, { quoted: m })
          
          // Pequeña pausa entre sticker y mensaje
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (stickerError) {
          console.log('Error enviando sticker:', stickerError)
        }
      }
      
      // === ENVIAR MENSAJE DE TEXTO ===
      await sock.sendMessage(m.chat, {
        text: mensajeCompleto,
        mentions: [m.sender]
      }, { quoted: m })
      
      // Mostrar en consola qué saludo salió (para debug)
      console.log(`Saludo enviado a ${nombreUsuario}: ${saludoElegido.titulo}`)
      
    } catch (error) {
      console.error('Error en comando hola:', error)
      
      // Mensaje de respaldo
      await m.reply(`╭─〔 👋 HOLA 〕─⬣
      
Hola *${m.pushName || 'usuario'}*!

Soy el bot creado por *Daniel*
Usa .menu para ver mis comandos.

╰────────────────⬣`)
    }
  }
}
