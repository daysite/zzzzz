// Comando de depuración - DEBUG ONLY
export default {
  command: ['debugmsg'],
  category: 'tools',
  
  run: async (sock, m, args) => {
    if (!m.quoted) {
      return m.reply('Responde a un mensaje para ver su estructura')
    }
    
    const quoted = m.quoted
    
    // Mostrar información clave
    const info = {
      hasViewOnce: !!quoted.viewOnce,
      hasIsViewOnce: !!quoted.isViewOnce,
      type: quoted.type,
      mimetype: quoted.mimetype,
      hasUrl: !!quoted.url,
      hasMediaBuffer: !!quoted.mediaBuffer,
      hasMessage: !!quoted.message,
      messageKeys: quoted.message ? Object.keys(quoted.message) : [],
      quotedKeys: Object.keys(quoted)
    }
    
    await m.reply(
      '📊 **Estructura del mensaje respondido:**\n\n' +
      `\`\`\`json\n${JSON.stringify(info, null, 2)}\n\`\`\``
    )
    
    // Si hay estructura viewOnce, mostrarla
    if (quoted.message) {
      const msg = quoted.message
      if (msg.viewOnceMessageV2) {
        await m.reply('✅ ES UN MENSAJE VIEW ONCE (viewOnceMessageV2)')
      } else if (msg.viewOnceMessage) {
        await m.reply('✅ ES UN MENSAJE VIEW ONCE (viewOnceMessage)')
      } else {
        await m.reply('❌ NO se detectó como viewOnce en la estructura')
      }
    }
  }
}
