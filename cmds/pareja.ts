export default {
  command: ['ship', 'pareja', 'emparejar'],
  category: 'juegos',

  run: async (sock, m, args) => {
    try {
      if (!m.isGroup) {
        return m.reply(
          '《✧》 Este comando solo funciona en grupos.'
        )
      }

      const groupMetadata =
        await sock.groupMetadata(m.chat)

      const participants =
        groupMetadata.participants
          .map(p => p.id || p.jid)
          .filter(Boolean)

      if (participants.length < 2) {
        return m.reply(
          '《✧》 Se necesitan al menos 2 integrantes.'
        )
      }

      // PERSONAS ALEATORIAS
      const random1 =
        participants[
          Math.floor(Math.random() * participants.length)
        ]

      let random2 =
        participants[
          Math.floor(Math.random() * participants.length)
        ]

      // EVITAR REPETIDOS
      while (random1 === random2) {
        random2 =
          participants[
            Math.floor(Math.random() * participants.length)
          ]
      }

      // MENSAJES BONITOS
      const mensajes = [
        '💖 Harían una pareja muy tierna.',
        '🥰 El destino los unió.',
        '💍 Definitivamente hay química.',
        '🌹 Se ven perfectos juntos.',
        '💕 Amor detectado en el grupo.',
        '✨ Nació una nueva pareja.',
        '💘 Cupido hizo su trabajo.',
        '😻 Todos apoyamos esta relación.'
      ]

      const randomMessage =
        mensajes[
          Math.floor(Math.random() * mensajes.length)
        ]

      await sock.sendMessage(
        m.chat,
        {
          text:
`╭─〔 💘 PAREJA DEL GRUPO 💘 〕─⬣

👤 @${random1.split('@')[0]}
💞 @${random2.split('@')[0]}

${randomMessage}

╰────────────────⬣`,
          mentions: [random1, random2]
        },
        { quoted: m }
      )

    } catch (e) {
      console.log(e)

      return m.reply(
        '《✧》 Ocurrió un error.'
      )
    }
  }
}
