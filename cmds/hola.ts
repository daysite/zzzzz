export default {
  command: ['hola', 'hello', 'hi', 'presentate', 'quienes', 'info'],
  category: 'general',

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      
      // Obtener el comando exacto que escribió el usuario
      const textoCompleto = m.text || ''
      const comandoExacto = textoCompleto.split(' ')[0]?.toLowerCase() || ''
      
      // Verificar si es comando de presentación
      const esPresentacion = comandoExacto === '.presentate' || 
                            comandoExacto === '.quienes' || 
                            comandoExacto === '.info'
      
      // Verificar si es comando de saludo
      const esSaludo = comandoExacto === '.hola' || 
                      comandoExacto === '.hello' || 
                      comandoExacto === '.hi'
      
      // Si no es ninguno de los comandos esperados, salir
      if (!esPresentacion && !esSaludo) {
        return m.reply('Comando no reconocido. Usa .hola o .presentate')
      }
      
      let mensaje = ''
      
      // === PRESENTACIÓN OFICIAL ===
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
      
      // === SALUDOS ALEATORIOS ===
      else if (esSaludo) {
        const saludosRandom = [
          `✨ ¡Hola *${nombreUsuario}*! ✨\n\n💝 Soy tu asistente personal\n• Creador: *Daniel* 🧑‍💻`,
          `¡Hey *${nombreUsuario}*! 🌟\n\n🤖 Bot creado por *Daniel*\nListo para lo que necesites`,
          `¡Buenos días *${nombreUsuario}*! ☀️\n\n*Daniel* me creó para ayudarte.`,
          `¡Wii! ¡Hola *${nombreUsuario}*! 🎊\n\nSoy el bot creado por *Daniel*`,
          `¡Miau *${nombreUsuario}*! 😺\n\nEl bot de *Daniel* te saluda.`,
          `Tómate un respiro *${nombreUsuario}* ☕\n\n*Daniel* me envió a saludarte.`,
          `¡Hola *${nombreUsuario}*! 💪\n\nTú puedes con todo hoy.`,
          `Un gusto saludarte *${nombreUsuario}* 🌸\n\nAsistente creado por *Daniel*`,
          `Buenas noches *${nombreUsuario}* 🌙\n\nCreado con cariño por *Daniel*`,
          `*SISTEMA ACTIVADO* 🔌\nUsuario: *${nombreUsuario}*\nCreador: Daniel`
        ]
        
        const randomIndex = Math.floor(Math.random() * saludosRandom.length)
        const titulos = ['👋 SALUDO', '🌟 ESPECIAL', '💫 MATUTINO', '🎉 ALEGRE', '🐱 GATUNO', '🍵 RELAJADO', '💪 MOTIVADOR', '🌸 CORTÉS', '🌙 NOCTURNO', '🤖 ROBÓTICO']
        
        mensaje = `╭─〔 ${titulos[randomIndex]} 〕─⬣\n\n${saludosRandom[randomIndex]}\n\n🎯 Usa .menu para más comandos\n\n╰────────────────⬣`
      }
      
      await sock.sendMessage(m.chat, {
        text: mensaje,
        mentions: [m.sender]
      }, { quoted: m })
      
    } catch (error) {
      console.error('Error:', error)
      await m.reply('《❌》 Error al procesar el comando.')
    }
  }
}
