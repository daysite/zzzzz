export default {
  command: ['testreveal'],
  category: 'tools',

  run: async (sock, m, args) => {
    if (!m.quoted) {
      return m.reply('Responde a un mensaje viewOnce')
    }

    const quoted = m.quoted
    
    try {
      // Intentar descargar
      let buffer = null
      
      if (typeof quoted.download === 'function') {
        buffer = await quoted.download()
      } else if (quoted.mediaBuffer) {
        buffer = quoted.mediaBuffer
      }
      
      // Mostrar información del buffer
      let info = `📊 **Diagnóstico:**\n\n`
      info += `• buffer existe: ${!!buffer}\n`
      info += `• buffer es Buffer: ${Buffer.isBuffer(buffer)}\n`
      info += `• tamaño: ${buffer?.length || 0} bytes\n`
      info += `• tipo MIME: ${quoted.mime || quoted.mimetype || 'desconocido'}\n`
      info += `• tipo mensaje: ${quoted.type}\n`
      
      // Verificar si parece una imagen (primeros bytes)
      if (buffer && buffer.length > 4) {
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50
        const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8
        info += `• formato detectado: ${isPNG ? 'PNG' : isJPEG ? 'JPEG' : 'desconocido'}\n`
      }
      
      await m.reply(info)
      
      // Si hay buffer válido, intentar enviarlo
      if (buffer && buffer.length > 100) {
        await m.reply('《📤》 Intentando enviar la imagen...')
        await sock.sendMessage(m.chat, { image: buffer }, { quoted: m })
        await m.reply('《✅》 Enviado!')
      } else {
        await m.reply('《❌》 No hay buffer válido para enviar')
      }
      
    } catch (err) {
      await m.reply(`Error: ${err.message}`)
    }
  }
}
