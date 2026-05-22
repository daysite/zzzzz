import fetch from 'node-fetch'

export default {
  command: ['hola', 'hello', 'hi', 'presentate', 'quienes', 'saludo'],
  category: 'general',

  // Lista de stickers de saludo (URLs de stickers animados y estáticos)
  stickerSaludos: [
    'https://media.tenor.com/GxSxTtXxXxQAAAAi/pikachu-hola.gif',
    'https://media.tenor.com/5oYxXxXxXxQAAAAi/anime-wave.gif',
    'https://media.tenor.com/3xXxXxXxXxQAAAAi/hello-sticker.gif',
    'https://i.pinimg.com/originals/8b/16/0a/8b160ae1d13f5bda98c9f6a7640ff47b.gif',
    'https://media.tenor.com/rxXxXxXxXxQAAAAi/cat-hello.gif'
  ],

  // Lista de saludos variados
  saludos: [
    {
      titulo: "👋 SALUDO CÁLIDO",
      mensaje: `Hola! Soy el asistente de este grupo.
      
Creador: *Daniel* 🧑‍💻
Arreglado para: *Nao* ❤️

¿En qué puedo ayudarte hoy?`
    },
    {
      titulo: "✨ BIENVENIDA ESPECIAL",
      mensaje: `¡Hey! Qué gusto verte por aquí.

• Mi creador *Daniel* me trajo a la vida
• Y todo este amor es especialmente para *Nao* ❤️

Estoy listo para lo que necesites.`
    },
    {
      titulo: "🌟 PRESENTACIÓN OFICIAL",
      mensaje: `Permíteme presentarme:

📌 *Nombre:* Asistente Virtual
👨‍💻 *Creador:* Daniel
💝 *Dedicado a:* Nao (con mucho cariño) ❤️
🔧 *Estado:* Activo y funcionando

¡Un placer saludarte!`
    },
    {
      titulo: "💫 SALUDO MATUTINO",
      mensaje: `¡Buenos días! ☀️

Que tengas un lindo día.
Recuerda que *Daniel* me creó para ti, *Nao* ❤️
Estoy aquí para ayudarte siempre.`
    },
    {
      titulo: "🌙 SALUDO NOCTURNO",
      mensaje: `Buenas noches 🌙

*Daniel* me mandó a decirte que descanses.
Y como siempre, esto va dedicado a *Nao* ❤️

¿Necesitas algo antes de dormir?`
    },
    {
      titulo: "🎉 SALUDO ALEGRE",
      mensaje: `¡Wii! ¡Qué emoción saludarte! 🎊

Soy el bot creado por *Daniel*
Y principalmente arreglado para *Nao* ❤️

¡Vamos a divertirnos!`
    },
    {
      titulo: "🤖 SALUDO ROBÓTICO",
      mensaje: `*SISTEMA ACTIVADO* 🔌

Usuario: ${(m) => m.pushName || 'Nao'}
Creador: Daniel
Dedicado a: Nao ❤️
Estado: 100% operativo

*COMANDOS DISPONIBLES* 📟
.pokemon - Juego de Pokémon
.sticker - Crear stickers
.yta / ytv - Descargar multimedia

*FIN DEL MENSAJE* 🔚`
    },
    {
      titulo: "💝 SALUDO ROMÁNTICO",
      mensaje: `Hola, hermosa/o 💕

Este mensaje viene con mucho amor.
*Daniel* me creó pensando en ti, *Nao* ❤️

Espero que tengas un día tan especial como tú.`
    }
  ],

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      const comandoUsado = (args[0] || m.text.split(' ')[0]?.toLowerCase() || '').replace('.', '')
      
      let stickerUrl = null
      let saludoElegido = null
      
      // === SELECCIONAR SALUDO SEGÚN EL COMANDO ===
      if (comandoUsado === 'presentate' || comandoUsado === 'quienes') {
        // Para presentación, siempre usar el saludo de presentación oficial
        saludoElegido = this.saludos[2]
        stickerUrl = this.stickerSaludos[0]
      } 
      else if (comandoUsado === 'saludo') {
        // Para .saludo, elegir uno aleatorio
        const randomIndex = Math.floor(Math.random() * this.saludos.length)
        saludoElegido = this.saludos[randomIndex]
        stickerUrl = this.stickerSaludos[Math.floor(Math.random() * this.stickerSaludos.length)]
      }
      else {
        // Para .hola, .hello, .hi - elegir aleatorio excepto el de presentación
        const saludosFiltrados = this.saludos.filter((_, index) => index !== 2)
        const randomIndex = Math.floor(Math.random() * saludosFiltrados.length)
        saludoElegido = saludosFiltrados[randomIndex]
        stickerUrl = this.stickerSaludos[Math.floor(Math.random() * this.stickerSaludos.length)]
      }
      
      // Reemplazar el placeholder del nombre si existe
      let mensajeFinal = saludoElegido.mensaje
      if (typeof mensajeFinal === 'function') {
        mensajeFinal = mensajeFinal({ pushName: nombreUsuario })
      }
      
      // Construir el mensaje completo con formato
      const mensajeCompleto = `╭─〔 ${saludoElegido.titulo} 〕─⬣
      
${mensajeFinal}

━━━━━━━━━━━━━━━━━━━━━

🎯 *Comandos rápidos:*
.pokemon - Captura Pokémon
.sticker - Crea stickers
.menu - Ver todos

╰────────────────⬣`
      
      // === ENVIAR STICKER (si hay URL) ===
      if (stickerUrl) {
        try {
          // Verificar si la URL es de un sticker animado o imagen
          const isGif = stickerUrl.includes('.gif') || stickerUrl.includes('tenor.com')
          
          if (isGif) {
            // Enviar como sticker animado
            const response = await fetch(stickerUrl)
            const buffer = await response.buffer()
            
            await sock.sendMessage(m.chat, {
              sticker: buffer,
              mimetype: 'image/gif'
            }, { quoted: m })
          } else {
            // Enviar como sticker normal
            const response = await fetch(stickerUrl)
            const buffer = await response.buffer()
            
            await sock.sendMessage(m.chat, {
              sticker: buffer
            }, { quoted: m })
          }
          
          // Pequeña pausa entre sticker y mensaje
          await new Promise(resolve => setTimeout(resolve, 500))
          
        } catch (stickerError) {
          console.log('Error enviando sticker:', stickerError)
          // Si falla el sticker, continuar solo con el mensaje
        }
      }
      
      // === ENVIAR MENSAJE DE TEXTO ===
      await sock.sendMessage(m.chat, {
        text: mensajeCompleto,
        mentions: [m.sender]
      }, { quoted: m })
      
    } catch (error) {
      console.error('Error en comando hola:', error)
      
      // Mensaje de respaldo si algo falla
      await m.reply(`╭─〔 👋 HOLA 〕─⬣
      
Hola *${m.pushName || 'usuario'}*!

Soy el bot creado por *Daniel*
Arreglado especialmente para *Nao* ❤️

Usa .menu para ver mis comandos.

╰────────────────⬣`)
    }
  }
}
