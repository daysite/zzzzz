export default {
  command: ['hola', 'hello', 'hi', 'presentate', 'quienes', 'info'],
  category: 'general',

  run: async (sock, m, args) => {
    try {
      const nombreUsuario = m.pushName || 'Usuario'
      
      // Para depuración: ver qué está llegando
      console.log('=== DEBUG COMANDO HOLAS ===')
      console.log('args:', args)
      console.log('m.text:', m.text)
      console.log('m.body:', m.body)
      console.log('m.message:', JSON.stringify(m.message, null, 2).substring(0, 500))
      
      // Intento 1: Usar el comando directamente del handler
      let cmd = ''
      
      if (m.text && m.text.startsWith('.')) {
        cmd = m.text.split(' ')[0].substring(1).toLowerCase()
      } else if (m.body && m.body.startsWith('.')) {
        cmd = m.body.split(' ')[0].substring(1).toLowerCase()
      }
      
      // Respuesta según el comando
      if (cmd === 'hola' || cmd === 'hello' || cmd === 'hi') {
        const saludos = [
          `✨ Hola *${nombreUsuario}*! ✨\n\nCreado por *Daniel*`,
          `¡Hey *${nombreUsuario}*! 🌟\n\nBot de *Daniel*`,
          `¡Buenos días *${nombreUsuario}*! ☀️\n\n*Daniel* me creó`,
          `¡Wii! *${nombreUsuario}*! 🎊\n\nSoy el bot de *Daniel*`
        ]
        const random = Math.floor(Math.random() * saludos.length)
        await m.reply(saludos[random])
      }
      else if (cmd === 'presentate' || cmd === 'quienes' || cmd === 'info') {
        await m.reply(`╭─〔 PRESENTACIÓN 〕─⬣
      
Hola *${nombreUsuario}*

• Creado por *Daniel* 🧑‍💻
• Arreglado para *Nao* ❤️

╰────────────────⬣`)
      }
      
    } catch (error) {
      console.error('Error:', error)
    }
  }
}
