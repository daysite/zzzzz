export default {
  command: ['hola', 'hello', 'hi', 'presentate', 'quienes', 'info'],
  category: 'general',

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      
      // Detectar correctamente qué comando se usó
      const comandoOriginal = m.text.split(' ')[0]?.toLowerCase() || ''
      const esPresentacion = comandoOriginal === '.presentate' || 
                            comandoOriginal === '.quienes' || 
                            comandoOriginal === '.info'
      
      let mensaje = ''
      
      // === PRESENTACIÓN OFICIAL (solo para .presentate, .quienes, .info) ===
      if (esPresentacion) {
        mensaje = `╭─〔 📋 PRESENTACIÓN OFICIAL 〕─⬣
      
👋 ¡Hola *${nombreUsuario}*! Mucho gusto.

━━━━━━━━━━━━━━━━━━━━━

🤖 *Sobre mí:*
• Fui creado por *Daniel* 🧑‍💻
• Principalmente arreglado para *Nao* ❤️
• Estoy aquí para ayudarte con lo que necesites

━━━━━━━━━━━━━━━━━━━━━

📌 *Comandos básicos:*
.hola - Saludo aleatorio
.pokemon - Juego de Pokémon
.sticker - Crea stickers
.yta / ytv - Descarga multimedia

━━━━━━━━━━━━━━━━━━━━━

💫 *"Hecho con dedicación para Nao"*

╰────────────────⬣`
      } 
      
      // === SALUDOS ALEATORIOS (solo para .hola, .hello, .hi) ===
      else {
        const saludosRandom = [
          {
            titulo: "👋 SALUDO CÁLIDO",
            texto: `✨ ¡Hola *${nombreUsuario}*! ✨\n\n💝 Soy tu asistente personal\n• Creador: *Daniel* 🧑‍💻\n• Estoy aquí para ayudarte\n\n🎯 Usa .menu para ver comandos`
          },
          {
            titulo: "🌟 SALUDO ESPECIAL",
            texto: `¡Hey *${nombreUsuario}*! 🌟\n\n🤖 Bot creado por *Daniel*\nListo para lo que necesites\n\n🎮 .pokemon - Captura Pokémon`
          },
          {
            titulo: "💫 SALUDO MATUTINO",
            texto: `¡Buenos días *${nombreUsuario}*! ☀️\n\nQue tengas un lindo día.\n*Daniel* me creó para ayudarte.\n\n¿En qué puedo asistirte hoy?`
          },
          {
            titulo: "🌙 SALUDO NOCTURNO",
            texto: `Buenas noches *${nombreUsuario}* 🌙\n\nDescansa bien.\nEstoy aquí cuando me necesites.\n\nCreado con cariño por *Daniel*`
          },
          {
            titulo: "🎉 SALUDO ALEGRE",
            texto: `¡Wii! ¡Hola *${nombreUsuario}*! 🎊\n\nSoy el bot creado por *Daniel*\n¡Vamos a divertirnos!\n\nUsa .menu para ver todo lo que puedo hacer`
          },
          {
            titulo: "🤖 SALUDO ROBÓTICO",
            texto: `*SISTEMA ACTIVADO* 🔌\n\nUsuario: *${nombreUsuario}*\nCreador: Daniel\nEstado: 100% operativo\n\n*COMANDOS:* .pokemon .sticker .yta`
          },
          {
            titulo: "🐱 SALUDO GATUNO",
            texto: `¡Miau *${nombreUsuario}*! 😺\n\nEl bot de *Daniel* te saluda.\n¿Necesitas algo?`
          },
          {
            titulo: "🍵 SALUDO RELAJADO",
            texto: `Tómate un respiro *${nombreUsuario}* ☕\n\n*Daniel* me envió a saludarte.\nRelájate y dime en qué te ayudo.`
          },
          {
            titulo: "💪 SALUDO MOTIVADOR",
            texto: `¡Hola *${nombreUsuario}*! 💪\n\nTú puedes con todo hoy.\n*Daniel* y yo confiamos en ti.\n\n¿Necesitas algo para empezar?`
          },
          {
            titulo: "🌸 SALUDO CORTÉS",
            texto: `Un gusto saludarte *${nombreUsuario}* 🌸\n\nSoy el asistente creado por *Daniel*\nPara brindarte la mejor experiencia.\n\n¿En qué puedo colaborar hoy?`
          }
        ]
        
        const randomIndex = Math.floor(Math.random() * saludosRandom.length)
        const saludo = saludosRandom[randomIndex]
        
        mensaje = `╭─〔 ${saludo.titulo} 〕─⬣\n\n${saludo.texto}\n\n╰────────────────⬣`
        
        console.log(`[DEBUG] Comando usado: ${comandoOriginal} | Saludo: ${saludo.titulo}`)
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
