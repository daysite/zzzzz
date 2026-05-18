export default {
  command: ['ship', 'lovemeter', 'amor'],
  category: 'juegos',

  run: async (sock, m, args) => {
    try {
      const user1 = m.sender
      const mention = m.mentionedJid?.[0]

      if (!mention) {
        return m.reply(
          '《✧》 Etiqueta a una persona.\n\nEjemplo:\n.love @usuario'
        )
      }

      if (mention === user1) {
        return m.reply(
          '《✧》 No puedes medir el amor contigo mismo 😹'
        )
      }

      // PORCENTAJE REAL DEL 1 AL 100
      const porcentaje =
        Math.floor(Math.random() * 100) + 1

      let mensaje = ''

      if (porcentaje <= 20) {
        mensaje = '💔 No hay mucha química...'
      } else if (porcentaje <= 40) {
        mensaje = '😅 Puede funcionar algún día.'
      } else if (porcentaje <= 60) {
        mensaje = '🥰 Hay sentimientos bonitos.'
      } else if (porcentaje <= 80) {
        mensaje = '💖 Se quieren bastante.'
      } else {
        mensaje = '💍 Amor verdadero 😻'
      }

      const llenos = Math.floor(porcentaje / 10)

      const barra =
        '█'.repeat(llenos) +
        '░'.repeat(10 - llenos)

      await sock.sendMessage(
        m.chat,
        {
          text:
`╭─〔 💘 MEDIDOR DE AMOR 💘 〕─⬣

👤 @${user1.split('@')[0]}
💞 @${mention.split('@')[0]}

❤️ Amor detectado:
[ ${barra} ]

💖 Compatibilidad: ${porcentaje}%

${mensaje}

╰────────────────⬣`,
          mentions: [user1, mention]
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Ocurrió un error.')
    }
  }
}
