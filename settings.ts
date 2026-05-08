import fs from 'fs';
import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath } from 'url'

global.owner = ['51924537931', '573104675480', '16473694569']
global.sessionName = 'Sessions/Owner'

global.api = {
  url: 'https://api.stellarwa.xyz',
  key: 'api-tYdgA' 
}

global.msgglobal = '⋆˚𝜗 There was a problem processing the request, contact the creator or a moderator to fix this issue. (✿◡‿◡)'
global.dev = `© ᴍᴀᴅᴇ ᴡɪᴛʜ ʙʏ ᴅᴀɴɪᴇʟッ`

global.mess = {
  socket: '(∩´͈ ᴖ `͈∩ ྀི) Este comando solo puede ser ejecutado por un Socket.',
  admin: '٩ʕ◕౪◕ʔو Este comando solo puede ser ejecutado por los Administradores del Grupo.',
  botAdmin: '(𓂂꜆◕⩊◕꜀𓂂) Este comando solo puede ser ejecutado si el Socket es Administrador del Grupo.',
  nsfw: '(•ૢ⚈͒⌄⚈͒•ૢ) Los comandos de *NSFW* están desactivados en este grupo.',
  comandooff: 'ღゝ◡╹ )ノ Estos comandos estan desactivados en este grupo.'
}

global.my = {
ch: "120363401360971612@newsletter", // Oficial
ch2: "120363401360971612@newsletter", // Api
ch3: "120363401360971612@newsletter" // Yuki
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  import(`${file}?update=${Date.now()}`)
})
