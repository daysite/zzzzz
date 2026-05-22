export default {
  command: ['hola', 'hello', 'hi', 'presentate', 'quienes', 'info'],
  category: 'general',

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      
      // Obtener el comando desde m.text o m.body
      let textoComando = m.text || m.body || ''
      
      // Eliminar el slash o punto al inicio
      let cmd = ''
      if (textoComando.startsWith('/')) {
        cmd = textoComando.substring(1).split(' ')[0].toLowerCase()
      } else if (textoComando.startsWith('.')) {
        cmd = textoComando.substring(1).split(' ')[0].toLowerCase()
      }
      
      console.log(`[DEBUG] Comando detectado: "${cmd}"`)
      
      let mensaje = ''
      
      // === PRESENTACIÓN OFICIAL (/presentate, /quienes, /info) ===
      if (cmd === 'presentate' || cmd === 'quienes' || cmd === 'info') {
        mensaje = `╭─〔 📋 PRESENTACIÓN OFICIAL 〕─⬣
      
👋 ¡Hola *${nombreUsuario}*! Mucho gusto.

━━━━━━━━━━━━━━━━━━━━━

🤖 *Sobre mí:*
• Fui creado por *Daniel* 🧑‍💻
• Principalmente arreglado para *Nao* ❤️
• Estoy aquí para ayudarte con lo que necesites

━━━━━━━━━━━━━━━━━━━━━

📌 *Comandos básicos:*
/hola - Saludo aleatorio
/pokemon - Juego de Pokémon
/sticker - Crea stickers
/yta /ytv - Descarga multimedia

━━━━━━━━━━━━━━━━━━━━━

💫 *"Hecho con dedicación para Nao"*

╰────────────────⬣`
      }
      
      // === SALUDOS ALEATORIOS (/hola, /hello, /hi) ===
      else if (cmd === 'hola' || cmd === 'hello' || cmd === 'hi') {
        const saludosRandom = [
          `✨ ¡Hola *${nombreUsuario}*! ✨\n\n💝 Soy tu asistente personal\n• Creador: *Daniel* 🧑‍💻\n• Estoy aquí para ayudarte\n\n🎯 Usa /menu para ver comandos`,
          `¡Hey *${nombreUsuario}*! 🌟\n\n🤖 Bot creado por *Daniel*\nListo para lo que necesites\n\n🎮 /pokemon - Captura Pokémon`,
          `¡Buenos días *${nombreUsuario}*! ☀️\n\nQue tengas un lindo día.\n*Daniel* me creó para ayudarte.\n\n¿En qué puedo asistirte hoy?`,
          `¡Wii! ¡Hola *${nombreUsuario}*! 🎊\n\nSoy el bot creado por *Daniel*\n¡Vamos a divertirnos!\n\nUsa /menu para ver todo lo que puedo hacer`,
          `¡Miau *${nombreUsuario}*! 😺\n\nEl bot de *Daniel* te saluda.\n¿Necesitas algo?`,
          `Tómate un respiro *${nombreUsuario}* ☕\n\n*Daniel* me envió a saludarte.\nRelájate y dime en qué te ayudo.`,
          `¡Hola *${nombreUsuario}*! 💪\n\nTú puedes con todo hoy.\n*Daniel* y yo confiamos en ti.\n\n¿Necesitas algo para empezar?`,
          `Un gusto saludarte *${nombreUsuario}* 🌸\n\nSoy el asistente creado por *Daniel*\nPara brindarte la mejor experiencia.\n\n¿En qué puedo colaborar hoy?`,
          `Buenas noches *${nombreUsuario}* 🌙\n\nDescansa bien.\nEstoy aquí cuando me necesites.\n\nCreado con cariño por *Daniel*`,
          `*SISTEMA ACTIVADO* 🔌\n\nUsuario: *${nombreUsuario}*\nCreador: Daniel\nEstado: 100% operativo\n\n*COMANDOS:* /pokemon /sticker /yta`
        ]
        
        const titulos = ['👋 SALUDO CÁLIDO', '🌟 SALUDO ESPECIAL', '💫 SALUDO MATUTINO', '🎉 SALUDO ALEGRE', '🐱 SALUDO GATUNO', '🍵 SALUDO RELAJADO', '💪 SALUDO MOTIVADOR', '🌸 SALUDO CORTÉS', '🌙 SALUDO NOCTURNO', '🤖 SALUDO ROBÓTICO']
        
        const randomIndex = Math.floor(Math.random() * saludosRandom.length)
        
        mensaje = `╭─〔 ${titulos[randomIndex]} 〕─⬣\n\n${saludosRandom[randomIndex]}\n\n╰────────────────⬣`
        
        console.log(`[SALUDO] Usuario: ${nombreUsuario} | Tipo: ${titulos[randomIndex]}`)
      }
      
      if (mensaje) {
        await sock.sendMessage(m.chat, {
          text: mensaje,
          mentions: [m.sender]
        }, { quoted: m })
      }
      
    } catch (error) {
      console.error('Error:', error)
      await m.reply('《❌》 Error al procesar el comando.')
    }
  }
}
