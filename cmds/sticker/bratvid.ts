import sharp from 'sharp';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export default {
  command: ['bratvid', 'bratvideo', 'bratv'],
  category: 'sticker',

  run: async (sock, m, args) => {
    try {
      let texto = args.join(' ');
      if (!texto || texto.trim() === '') {
        await m.reply('🎬 *Sticker Animado BRAT*\n\nEjemplo: `.bratvid Hola mundo`\n`.bratv Nao es lo maximo`\n\n> Genera un *sticker animado* (GIF/MP4) con estilo BRAT');
        return;
      }

      await m.reply('🎬 *Generando sticker animado...*\n⏱️ Creando animación, espera...');

      // --- 1. Obtener el video de la API (corrigiendo el error 400) ---
      // Aseguramos que el texto no esté vacío y codificamos correctamente
      const textoCrudo = texto.trim();
      if (textoCrudo.length === 0) throw new Error('El texto no puede estar vacío');
      
      const textoCodificado = encodeURIComponent(textoCrudo).replace(/%20/g, '+');
      // La URL base que me proporcionaste. Es importante enviar 'text' con valor.
      const apiUrl = `https://api.delirius.store/canvas/bratvideo?text=${textoCodificado}`;
      console.log(`[BRATVID] Solicitando a: ${apiUrl}`);

      // Opciones para evitar caché y timeouts largos
      const response = await fetch(apiUrl, { 
        method: 'GET',
        headers: { 'Accept': 'video/mp4,video/webm,image/gif' },
        timeout: 30000 
      });

      if (!response.ok) {
        // Si la API responde con 400, intentamos con un texto de ejemplo para debug
        if (response.status === 400) {
          console.log('[BRATVID] Error 400 - Texto problemático:', textoCrudo);
          // Fallback: intentamos con un texto más simple para diagnosticar
          const testUrl = `https://api.delirius.store/canvas/bratvideo?text=TEST`;
          const testResponse = await fetch(testUrl);
          if (testResponse.ok) {
            throw new Error(`La API rechazó el texto "${textoCrudo}". Prueba con texto sin caracteres especiales o más corto.`);
          } else {
            throw new Error(`La API devolvió error 400. Es posible que el servicio 'bratvideo' no esté funcionando.`);
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let videoBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`[BRATVID] Descargado: ${videoBuffer.length} bytes, Tipo: ${contentType}`);

      // --- 2. Validación y conversión a formato válido para sticker animado ---
      if (videoBuffer.length < 1000) {
        throw new Error('El archivo descargado está vacío o es muy pequeño.');
      }

      let stickerBuffer = videoBuffer;
      let mimetype = 'video/mp4'; // Por defecto

      // Si es MP4, lo dejamos como está (WhatsApp acepta MP4 como sticker animado)
      if (contentType.includes('mp4')) {
        console.log('[BRATVID] Formato MP4 detectado. Verificando validez...');
        // Validación rápida: debe contener 'ftyp' en la cabecera
        const isMp4 = videoBuffer.toString('hex', 4, 8) === '66747970';
        if (!isMp4) {
          console.log('[BRATVID] El archivo no es un MP4 válido, intentando convertir...');
          // Forzamos conversión a MP4 sano con ffmpeg (si está instalado)
          const inputPath = `/tmp/brat_input_${Date.now()}.bin`;
          const outputPath = `/tmp/brat_output_${Date.now()}.mp4`;
          await require('fs').promises.writeFile(inputPath, videoBuffer);
          try {
            await execPromise(`ffmpeg -i ${inputPath} -c copy -movflags +faststart ${outputPath} -y`);
            stickerBuffer = await require('fs').promises.readFile(outputPath);
            mimetype = 'video/mp4';
            console.log(`[BRATVID] Conversión exitosa: ${stickerBuffer.length} bytes`);
          } catch (e) {
            console.log('[BRATVID] Conversión falló, se usará el original.');
          } finally {
            await require('fs').promises.unlink(inputPath).catch(() => {});
            await require('fs').promises.unlink(outputPath).catch(() => {});
          }
        }
      } 
      // Si es WebM, ideal para stickers
      else if (contentType.includes('webm')) {
        mimetype = 'video/webm';
        console.log('[BRATVID] Formato WebM detectado, es ideal para stickers.');
      }
      // Si es GIF, lo convertimos a WebM o MP4
      else if (contentType.includes('gif')) {
        console.log('[BRATVID] Formato GIF detectado, convirtiendo a MP4...');
        const inputPath = `/tmp/brat_gif_${Date.now()}.gif`;
        const outputPath = `/tmp/brat_gif_${Date.now()}.mp4`;
        await require('fs').promises.writeFile(inputPath, videoBuffer);
        try {
          await execPromise(`ffmpeg -i ${inputPath} -movflags +faststart ${outputPath} -y`);
          stickerBuffer = await require('fs').promises.readFile(outputPath);
          mimetype = 'video/mp4';
        } catch (e) { /* fallback al original */ }
        await require('fs').promises.unlink(inputPath).catch(() => {});
        await require('fs').promises.unlink(outputPath).catch(() => {});
      }

      // --- 3. Envío del sticker animado (con reintentos) ---
      console.log(`[BRATVID] Enviando sticker animado (${mimetype})...`);
      try {
        await sock.sendMessage(m.chat, {
          sticker: stickerBuffer,
          mimetype: mimetype
        }, { quoted: m });
        console.log('[BRATVID] Sticker animado enviado con éxito.');
        // Mensaje de éxito opcional (comenta si sobra)
        // await m.reply('✅ *Sticker animado generado!* \n✨ Debería verse correctamente en tu celular.');
      } catch (sendError) {
        console.error('[BRATVID] Error al enviar como sticker:', sendError);
        // Último intento: enviar como video GIF (se reproduce automático)
        await sock.sendMessage(m.chat, {
          video: stickerBuffer,
          mimetype: 'video/mp4',
          gifPlayback: true,
          caption: `🎬 *${texto}*\n\n⚠️ No se pudo enviar como sticker animado, pero aquí tienes el video.\n*Puedes convertirlo a sticker manualmente.*`
        }, { quoted: m });
      }

    } catch (error) {
      console.error('[BRATVID ERROR]', error);
      let mensajeError = '❌ *Error al generar el sticker animado*\n\n';
      if (error.message.includes('400')) {
        mensajeError += '🔧 *Texto no aceptado por la API.*\n\nIntenta con texto sin caracteres especiales, más corto o solo letras.\n\n✅ *Alternativa:* Usa `.brat ' + args.join(' ') + '` (sticker normal).';
      } else if (error.message.includes('pequeño') || error.message.includes('vacío')) {
        mensajeError += '📭 *La API devolvió un archivo vacío.*\n\nPuede ser un problema temporal del servicio.\n\n✅ *Intenta de nuevo más tarde.*';
      } else {
        mensajeError += `⚠️ *Error:* ${error.message}\n\n✅ *Alternativa:* Usa \`.brat ${args.join(' ') || 'texto'}\` (sticker normal).`;
      }
      await m.reply(mensajeError);
    }
  }
};
