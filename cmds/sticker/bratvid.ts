import sharp from 'sharp'
import { promises as fs } from 'fs'
import { exec } from 'child_process'
import util from 'util'

const execPromise = util.promisify(exec)

export default {
  command: ['bratvid', 'bratvideo', 'bratv'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      let texto = args.join(' ')
      
      if (!texto || texto.trim() === '') {
        await m.reply('《🎬》 *Sticker Animado BRAT*\n\nEjemplo:\n`.bratvid Hola mundo`\n`.bratv Nao es lo maximo`\n\n*Genera sticker ANIMADO con texto estilo BRAT*')
        return
      }

      await m.reply('《🎬》 *Generando sticker animado...*\n⏱️ Creando animación, esto toma unos segundos...')

      // Texto en mayúsculas para estilo BRAT
      const textoAnimado = texto.toUpperCase()
      
      // Crear frames para la animación (efecto de rebote/pulso)
      const frames = []
      const sizes = [1, 1.1, 1, 0.9, 1] // Tamaños para efecto de latido
      
      for (let i = 0; i < sizes.length; i++) {
        const scale = sizes[i]
        
        // Crear imagen con sharp
        const width = 512
        const height = 512
        
        // SVG con texto escalado
        const fontSize = Math.floor(48 * scale)
        const svg = `
          <svg width="${width}" height="${height}">
            <rect width="${width}" height="${height}" fill="#8ACE00"/>
            <text x="50%" y="50%" 
                  font-family="Arial, sans-serif" 
                  font-size="${fontSize}px" 
                  font-weight="bold"
                  fill="white" 
                  text-anchor="middle" 
                  dominant-baseline="middle"
                  stroke="black" 
                  stroke-width="3">
              ${textoAnimado}
            </text>
          </svg>
        `
        
        const frameBuffer = await sharp(Buffer.from(svg))
          .png()
          .toBuffer()
        
        frames.push(frameBuffer)
      }
      
      // Guardar frames temporalmente
      const tempDir = `/tmp/brat_anim_${Date.now()}`
      await fs.mkdir(tempDir, { recursive: true })
      
      const framePaths = []
      for (let i = 0; i < frames.length; i++) {
        const framePath = `${tempDir}/frame_${i}.png`
        await fs.writeFile(framePath, frames[i])
        framePaths.push(framePath)
      }
      
      // Crear GIF animado usando ffmpeg
      const outputGif = `${tempDir}/output.gif`
      const ffmpegCmd = `ffmpeg -framerate 5 -i ${tempDir}/frame_%d.png -vf "scale=512:512:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 ${outputGif} -y`
      
      await execPromise(ffmpegCmd)
      
      // Leer el GIF generado
      const gifBuffer = await fs.readFile(outputGif)
      
      // Convertir GIF a WebM (mejor para stickers de WhatsApp)
      const outputWebm = `${tempDir}/output.webm`
      const webmCmd = `ffmpeg -i ${outputGif} -c:v libvpx -b:v 500k -crf 30 -an ${outputWebm} -y`
      await execPromise(webmCmd)
      
      let stickerBuffer = gifBuffer
      let mimetype = 'image/gif'
      
      // Intentar usar WebM si se generó correctamente
      try {
        const webmBuffer = await fs.readFile(outputWebm)
        if (webmBuffer.length > 0) {
          stickerBuffer = webmBuffer
          mimetype = 'video/webm'
          console.log('[BRATVID] Usando formato WebM')
        }
      } catch (e) {
        console.log('[BRATVID] Usando formato GIF')
      }
      
      // Enviar como sticker animado
      await sock.sendMessage(m.chat, {
        sticker: stickerBuffer,
        mimetype: mimetype
      }, { quoted: m })
      
      // Limpiar archivos temporales
      await fs.rm(tempDir, { recursive: true, force: true })
      
      console.log(`[BRATVID] Sticker animado enviado: "${texto}"`)

    } catch (error) {
      console.error('[BRATVID ERROR]', error)
      
      // Si falla la animación, enviar sticker normal como fallback
      try {
        await m.reply('《🔄》 *Generando sticker normal como alternativa...*')
        const textoNormal = args.join(' ').toUpperCase()
        const apiUrl = `https://api.delirius.store/canvas/brat?text=${encodeURIComponent(textoNormal).replace(/%20/g, '+')}`
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const imgBuffer = Buffer.from(await response.arrayBuffer())
          await sock.sendMessage(m.chat, {
            sticker: imgBuffer,
            mimetype: 'image/webp'
          }, { quoted: m })
        }
      } catch (fallbackError) {
        await m.reply('《❌》 *Error al generar el sticker*\n\nNo se pudo crear ni el animado ni el normal.\n\n💡 Intenta con texto más corto o sin caracteres especiales.')
      }
    }
  }
}
