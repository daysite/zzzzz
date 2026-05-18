const juegosAdivinanza =
  global.juegosAdivinanza ||
  (global.juegosAdivinanza = {})

const preguntas = [
  {
    pregunta: 'Tiene cuatro patas y ladra.',
    respuesta: 'perro'
  },
  {
    pregunta: 'Fruta roja relacionada con Newton.',
    respuesta: 'manzana'
  },
  {
    pregunta: 'Sale de día e ilumina el mundo.',
    respuesta: 'sol'
  },
  {
    pregunta: 'Animal que maúlla.',
    respuesta: 'gato'
  },
  {
    pregunta: 'Vehículo de cuatro ruedas.',
    respuesta: 'carro'
  },
  {
    pregunta: 'Necesaria para vivir y transparente.',
    respuesta: 'agua'
  },
  {
    pregunta: 'Tiene ocho patas y hace telarañas.',
    respuesta: 'araña'
  },
  {
    pregunta: 'Animal más grande de la tierra.',
    respuesta: 'elefante'
  },
  {
    pregunta: 'Animal que canta al amanecer.',
    respuesta: 'gallo'
  },
  {
    pregunta: 'Fruta amarilla y alargada.',
    respuesta: 'platano'
  },
  {
    pregunta: 'Cae del cielo cuando hace frío.',
    respuesta: 'nieve'
  },
  {
    pregunta: 'Quema y da calor.',
    respuesta: 'fuego'
  },
  {
    pregunta: 'Aparece de noche en el cielo.',
    respuesta: 'luna'
  },
  {
    pregunta: 'Vive en el agua y tiene aletas.',
    respuesta: 'pez'
  },
  {
    pregunta: 'Lugar donde hay muchos libros.',
    respuesta: 'biblioteca'
  },
  {
    pregunta: 'Sirve para saber la hora.',
    respuesta: 'reloj'
  },
  {
    pregunta: 'Rey de la selva.',
    respuesta: 'leon'
  },
  {
    pregunta: 'Comida italiana redonda.',
    respuesta: 'pizza'
  },
  {
    pregunta: 'Vehículo que vuela.',
    respuesta: 'avion'
  },
  {
    pregunta: 'Tiene hojas y da sombra.',
    respuesta: 'arbol'
  },
  {
    pregunta: 'Agua congelada.',
    respuesta: 'hielo'
  },
  {
    pregunta: 'Produce miel.',
    respuesta: 'abeja'
  },
  {
    pregunta: 'Sirve para llamar y enviar mensajes.',
    respuesta: 'telefono'
  },
  {
    pregunta: 'La usa un rey en la cabeza.',
    respuesta: 'corona'
  },
  {
    pregunta: 'Tiene muchos colores y aparece después de la lluvia.',
    respuesta: 'arcoiris'
  },
  {
    pregunta: 'Animal blanco y negro parecido a un caballo.',
    respuesta: 'cebra'
  },
  {
    pregunta: 'Objeto que usas para escribir.',
    respuesta: 'lapiz'
  },
  {
    pregunta: 'Sirve para cortar papel.',
    respuesta: 'tijeras'
  },
  {
    pregunta: 'Planeta donde vivimos.',
    respuesta: 'tierra'
  },
  {
    pregunta: 'Tiene dientes pero no muerde.',
    respuesta: 'peine'
  },
  {
    pregunta: 'Tiene teclas pero no abre puertas.',
    respuesta: 'piano'
  },
  {
    pregunta: 'Tiene cuello pero no cabeza.',
    respuesta: 'botella'
  },
  {
    pregunta: 'Mientras más seca, más moja.',
    respuesta: 'toalla'
  },
  {
    pregunta: 'Sube y baja pero nunca se mueve.',
    respuesta: 'escalera'
  },
  {
    pregunta: 'Tiene agujas pero no pincha.',
    respuesta: 'reloj'
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

      const sentMessage =
        await sock.sendMessage(
          m.chat,
          {
            text:
`╭─〔 ADIVINANZA 〕─⬣

Pregunta:
${random.pregunta}

Tiempo: 1 minuto
Intentos: 3

Responde este mensaje con tu respuesta.

╰────────────────⬣`
          },
          { quoted: m }
        )

      juegosAdivinanza[m.chat] = {
        respuesta:
          random.respuesta.toLowerCase(),

        intentos: 3,

        jugador: m.sender,

        messageId:
          sentMessage.key.id
      }

      setTimeout(async () => {

        if (juegosAdivinanza[m.chat]) {

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
        }

      }, 60000)

    } catch (e) {
      console.log(e)

      return m.reply(
        '《✧》 Ocurrió un error.'
      )
    }
  }
}

export const before = async (sock, m) => {

  try {

    const juego =
      juegosAdivinanza[m.chat]

    if (!juego) return

    // SOLO RESPONDIENDO AL MENSAJE
    const quotedId =
      m.message?.extendedTextMessage?.contextInfo?.stanzaId

    if (!quotedId) return

    if (quotedId !== juego.messageId) return

    const texto =
      (
        m.body ||
        m.text ||
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

Respuesta:
${juego.respuesta}`,
          mentions: [m.sender]
        },
        { quoted: m }
      )

      delete juegosAdivinanza[m.chat]
      return
    }

    // RESTAR INTENTOS
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
