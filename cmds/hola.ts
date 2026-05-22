export default {
  command: ['hola', 'hello', 'hi', 'presentate', 'quienes', 'info'],
  category: 'general',

  // Lista de saludos aleatorios para .hola (NINGUNO menciona a Nao)
  saludosRandom: [
    {
      titulo: "👋 SALUDO CÁLIDO",
      mensaje: `✨ ¡Hola *{nombre}*! ✨

━━━━━━━━━━━━━━━━━━━━━

💝 Soy tu asistente personal

• Creador: *Daniel* 🧑‍💻
• Estoy aquí para ayudarte

━━━━━━━━━━━━━━━━━━━━━

🎯 *¿Necesitas ayuda?*
Usa .menu o .help`
    },
    {
      titulo: "🌟 SALUDO ESPECIAL",
      mensaje: `¡Hey *{nombre}*! 🌟

━━━━━━━━━━━━━━━━━━━━━

🤖 Bot creado por *Daniel*
Listo para lo que necesites

━━━━━━━━━━━━━━━━━━━━━

🎮 *Comandos disponibles:*
.pokemon - Captura Pokémon
.sticker - Crea stickers`
    },
    {
      titulo: "💫 SALUDO MATUTINO",
      mensaje: `¡Buenos días *{nombre}*! ☀️

━━━━━━━━━━━━━━━━━━━━━

Que tengas un lindo día.
*Daniel* me creó para ayudarte.

━━━━━━━━━━━━━━━━━━━━━

¿En qué puedo asistirte hoy?`
    },
    {
      titulo: "🌙 SALUDO NOCTURNO",
      mensaje: `Buenas noches *{nombre}* 🌙

━━━━━━━━━━━━━━━━━━━━━

Descansa bien.
Estoy aquí cuando me necesites.

━━━━━━━━━━━━━━━━━━━━━

Creado con cariño por *Daniel*`
    },
    {
      titulo: "🎉 SALUDO ALEGRE",
      mensaje: `¡Wii! ¡Hola *{nombre}*! 🎊

━━━━━━━━━━━━━━━━━━━━━

Soy el bot creado por *Daniel*
¡Vamos a divertirnos!

━━━━━━━━━━━━━━━━━━━━━

Usa .menu para ver todo lo que puedo hacer`
    },
    {
      titulo: "🤖 SALUDO ROBÓTICO",
      mensaje: `*SISTEMA ACTIVADO* 🔌

Usuario: *{nombre}*
Creador: Daniel
Estado: 100% operativo

*COMANDOS DISPONIBLES* 📟
.pokemon - Juego de Pokémon
.sticker - Crear stickers
.yta / ytv - Descargar multimedia`
    },
    {
      titulo: "🐱 SALUDO GATUNO",
      mensaje: `¡Miau *{nombre}*! 😺

━━━━━━━━━━━━━━━━━━━━━

El bot de *Daniel* te saluda.
¿Necesitas algo?`
    },
    {
      titulo: "🍵 SALUDO RELAJADO",
      mensaje: `Tómate un respiro *{nombre}* ☕

━━━━━━━━━━━━━━━━━━━━━

*Daniel* me envió a saludarte.
Relájate y dime en qué te ayudo.`
    },
    {
      titulo: "💪 SALUDO MOTIVADOR",
      mensaje: `¡Hola *{nombre}*! 💪

━━━━━━━━━━━━━━━━━━━━━

Tú puedes con todo hoy.
*Daniel* y yo confiamos en ti.

━━━━━━━━━━━━━━━━━━━━━

¿Necesitas algo para empezar?`
    },
    {
      titulo: "🌸 SALUDO CORTÉS",
      mensaje: `Un gusto saludarte *{nombre}* 🌸

━━━━━━━━━━━━━━━━━━━━━

Soy el asistente creado por *Daniel*
Para brindarte la mejor experiencia.

━━━━━━━━━━━━━━━━━━━━━

¿En qué puedo colaborar hoy?`
    }
  ],

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      
      // Diferentes saludos según el comando usado
      const comandoUsado = args[0] || m.text.split(' ')[0]?.toLowerCase() || ''
      
      let mensaje = ''
      
      // PRESENTACIÓN OFICIAL (solo para .presentate, .quienes, .info)
      if (comandoUsado === 'presentate' || comandoUsado === 'quienes' || comandoUsado === 'info') {
        mensaje = `╭─〔 📋 PRESENTACIÓN OFICIAL 〕─⬣
      
👋 ¡Hola *${nombreUsuario}*! Mucho gusto.

━━━━━━━━━━━━━━━━━━━━━

🤖 *Sobre mí:*
• Fui creado por *Daniel* 🧑‍💻
• Principalmente arreglado para *Nao* ❤️
• Estoy aquí para ayudarte con lo que necesites

━━━━━━━━━━━━━━━━━━━━━

📌 *Comandos básicos:*
.hola - Ver este mensaje
.pokemon - Juego de Pokémon
.sticker - Crea stickers
.yta / ytv - Descarga multimedia

━━━━━━━━━━━━━━━━━━━━━

💫 *"Hecho con dedicación para Nao"*

╰────────────────⬣`
      } 
      // SALUDO ALEATORIO (para .hola, .hello, .hi)
      else {
        // Elegir un saludo aleatorio de la lista
        const randomIndex = Math.floor(Math.random() * this.saludosRandom.length)
        const saludoElegido = this.saludosRandom[randomIndex]
        
        // Reemplazar el placeholder {nombre} con el nombre del usuario
        let textoSaludo = saludoElegido.mensaje.replace(/{nombre}/g, nombreUsuario)
        
        mensaje = `╭─〔 ${saludoElegido.titulo} 〕─⬣
      
${textoSaludo}

╰────────────────⬣`
        
        // Mostrar en consola qué saludo salió (para debug)
        console.log(`Saludo aleatorio para ${nombreUsuario}: ${saludoElegido.titulo}`)
      }
      
      await sock.sendMessage(m.chat, {
        text: mensaje,
        mentions: [m.sender]
      }, { quoted: m })
      
    } catch (error) {
      console.error('Error:', error)
      await m.reply('《❌》 Error al saludar.')
    }
  }
}
