export default {
  command: ['everyone', 'all', 'tagall'],
  category: 'grupo',
  isAdmin: true,

  run: async (sock, m, args) => {
    try {
      const text = args.join(' ')

      if (!m.isGroup) {
        return m.reply('《✤》 Este comando solo funciona en grupos.')
      }

      const groupMetadata = await sock.groupMetadata(m.chat).catch(() => null)
      const groupParticipants = groupMetadata?.participants || []

      const mentions = groupParticipants
        .map(p => p.jid || p.id || p.lid || p.phoneNumber)
        .filter(Boolean)
        .map(id => sock.decodeJid(id))

      const totalMembers = mentions.length

      let tagText = `╭─〔 👥 ETIQUETANDO A TODOS 〕─⬣\n`
      tagText += `│ 👤 Integrantes: ${totalMembers}\n`
      tagText += `╰────────────────⬣\n\n`

      for (let user of mentions) {
        tagText += `➤ @${user.split('@')[0]}\n`
      }

      const finalText = text
        ? `${text}\n\n${tagText}`
        : tagText

      return sock.sendMessage(
        m.chat,
        {
          text: finalText,
          mentions
        },
        {
          quoted: m
        }
      )

    } catch (e) {
      console.log(e)
      return m.reply(msgglobal)
    }
  }
}
