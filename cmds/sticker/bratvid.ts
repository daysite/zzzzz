export default {
  command: ['bratvid', 'bratvideo', 'bratv'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      let texto = args.join(' ')
      
      if (!texto || texto.trim() === '') {
        await m.reply('《🎬》 *¿Cómo usar el comando bratvideo?*\n\nEjemplo:\n`.bratvid Hola mundo`\n\n*Genera sticker NORMAL con estilo BRAT (la versión animada no está disponible)*')
        return
      }

      await m.reply('《🎨》 *Generando sticker brat...*\n⏱️ Procesando...')

      // Usar la API de IMAGEN que SÍ funciona
      const textoCodificado = encodeURIComponent(texto).replace(/%20/g, '+')
      const apiUrl = `https://api.delirius.store/canvas/brat?text=${textoCodificado}`
      
      console.log(`[BRATVID] Usando API de imagen: ${apiUrl}`)

      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const imagenBuffer = Buffer.from(await response.arrayBuffer())
      
      console.log(`[BRATVID] Imagen descargada - Tamaño: ${imagenBuffer.length} bytes`)

      // Enviar como STICKER (no como video)
      await sock.sendMessage(m.chat, {
        sticker: imagenBuffer,
        mimetype: 'image/webp'
      }, { quoted: m })

      console.log('[BRATVID] Sticker enviado con éxito')

    } catch (error) {
      console.error('[BRATVID ERROR]', error)
      await m.reply('《❌》 *Error al generar el sticker*\n\nIntenta con otro texto o usa `.brat ' + (args.join(' ') || 'texto') + '`')
    }
  }
}
