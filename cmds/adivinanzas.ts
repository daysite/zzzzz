const juegosAdivinanza =
  global.juegosAdivinanza ||
  (global.juegosAdivinanza = {})

const preguntas = [
  {
    pregunta: 'Tiene cuatro patas y ladra.',
    respuesta: 'perro'
  },
  {
    pregunta: 'Agua congelada.',
    respuesta: 'hielo'
  },
  {
    pregunta: 'Fruta roja relacionada con Newton.',
    respuesta: 'manzana'
  },
  {
    pregunta: 'Sale de día e ilumina la tierra.',
    respuesta: 'sol'
  },
  {
    pregunta: 'Animal que maúlla.',
    respuesta: 'gato'
  },
  {
    pregunta: 'Tiene agujas pero no pincha.',
    respuesta: 'reloj'
  },
  {
    pregunta: 'Mientras más seca, más moja.',
    respuesta: 'toalla'
  },
  {
    pregunta: 'Tiene cuello pero no cabeza.',
    respuesta: 'botella'
  },
  {
    pregunta: 'Rey de la selva.',
    respuesta: 'leon'
  },
  {
    pregunta: 'Vehículo que vuela.',
    respuesta: 'avion'
  },
  {
    pregunta: 'Produce miel.',
    respuesta: 'abeja'
  },
  {
    pregunta: 'Tiene teclas pero no abre puertas.',
    respuesta: 'piano'
  },
  {
    pregunta: 'Sube y baja pero no se mueve.',
    respuesta: 'escalera'
  },
  {
    pregunta: 'Tiene dientes pero no muerde.',
    respuesta: 'peine'
  },
  {
    pregunta: 'Comida italiana redonda.',
    respuesta: 'pizza'
  },
  {
    pregunta: 'Animal más grande de la tierra.',
    respuesta: 'elefante'
  },
  {
    pregunta: 'Objeto que sirve para escribir.',
    respuesta: 'lapiz'
  },
  {
    pregunta: 'Planeta donde vivimos.',
    respuesta: 'tierra'
  },
  {
    pregunta: 'Lugar donde hay muchos libros.',
    respuesta: 'biblioteca'
  },
  {
    pregunta: 'Cae del cielo cuando hace frío.',
    respuesta: 'nieve'
  }
]

export default {
  command: ['adivinanza', 'guess'],
  category: 'juegos',

  run: async (sock, m) => {
    try {

      if (juegosAdivinanza[m.chat]) {
        return m.reply(
          '《✧》 Ya hay una adivinanza activa en este chat.'
        )
      }

      const random =
        preguntas[
          Math.floor(Math.random() * preguntas.length)
        ]

      // ENVIAR PREGUNTA
      const msg = await sock.sendMessage(
        m.chat,
        {
          text:
`╭─〔 ADIVINANZA 〕─⬣

Pregunta:
${random.pregunta}

Tiempo: 1 minuto
Intentos: 3

Responde ESTE mensaje con tu respuesta.

╰────────────────⬣`
        },
        { quoted: m }
      )

      // GUARDAR DATOS
      juegosAdivinanza[m.chat] = {
        respuesta: random.respuesta.toLowerCase(),
        intentos: 3,
        messageId: msg.key.id
      }

      // TIEMPO
      setTimeout(async () => {

        if (!juegosAdivinanza[m.chat]) return

        const respuesta =
          juegosAdivinanza[m.chat].respuesta

        delete juegosAdivinanza[m.chat]

        await sock.sendMessage(
          m.chat,
          {
            text:
`《✧》 Tiempo agotado.

Respuesta correcta:
${respuesta}`
          }
        )

      }, 60000)

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Ocurrió un error.')
    }
  }
}

// DETECTOR
export const before = async (sock, m) => {

  try {

    const juego =
      juegosAdivinanza[m.chat]

    if (!juego) return

    // DETECTAR RESPUESTA AL MENSAJE
    const quoted =
      m.message?.extendedTextMessage?.contextInfo

    if (!quoted) return

    const stanzaId = quoted.stanzaId

    if (stanzaId !== juego.messageId) return

    const texto =
      (
        m.text ||
        m.body ||
        ''
      )
        .toLowerCase()
        .trim()

    if (!texto) return

    // CORRECTO
    if (texto === juego.respuesta) {

      await sock.sendMessage(
        m.chat,
        {
          text:
`《✧》 Respuesta correcta.

Usuario:
@${m.sender.split('@')[0]}

La respuesta era:
${juego.respuesta}`,
          mentions: [m.sender]
        },
        { quoted: m }
      )

      delete juegosAdivinanza[m.chat]
      return
    }

    // INCORRECTO
    juego.intentos--

    if (juego.intentos <= 0) {

      await sock.sendMessage(
        m.chat,
        {
          text:
`《✧》 Se acabaron los intentos.

Respuesta correcta:
${juego.respuesta}`
        },
        { quoted: m }
      )

      delete juegosAdivinanza[m.chat]
      return
    }

    await sock.sendMessage(
      m.chat,
      {
        text:
`《✧》 Respuesta incorrecta.

Intentos restantes:
${juego.intentos}`
      },
      { quoted: m }
    )

  } catch (e) {
    console.log(e)
  }
}
