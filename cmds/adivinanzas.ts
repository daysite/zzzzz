const juegosAdivinanza =
  global.juegosAdivinanza ||
  (global.juegosAdivinanza = {})

const preguntas = [
  { pregunta: 'Agua congelada.', respuesta: 'hielo' },
  { pregunta: 'Tiene cuatro patas y ladra.', respuesta: 'perro' },
  { pregunta: 'Animal que maúlla.', respuesta: 'gato' },
  { pregunta: 'Sale de día e ilumina la tierra.', respuesta: 'sol' },
  { pregunta: 'Fruta roja relacionada con Newton.', respuesta: 'manzana' },
  { pregunta: 'Tiene agujas pero no pincha.', respuesta: 'reloj' },
  { pregunta: 'Mientras más seca, más moja.', respuesta: 'toalla' },
  { pregunta: 'Tiene cuello pero no cabeza.', respuesta: 'botella' },
  { pregunta: 'Vehículo que vuela.', respuesta: 'avion' },
  { pregunta: 'Produce miel.', respuesta: 'abeja' },
  { pregunta: 'Rey de la selva.', respuesta: 'leon' },
  { pregunta: 'Comida italiana redonda.', respuesta: 'pizza' },
  { pregunta: 'Tiene teclas pero no abre puertas.', respuesta: 'piano' },
  { pregunta: 'Sube y baja pero no se mueve.', respuesta: 'escalera' },
  { pregunta: 'Tiene dientes pero no muerde.', respuesta: 'peine' },
  { pregunta: 'Objeto para escribir.', respuesta: 'lapiz' },
  { pregunta: 'Planeta donde vivimos.', respuesta: 'tierra' },
  { pregunta: 'Lugar con muchos libros.', respuesta: 'biblioteca' },
  { pregunta: 'Cae del cielo cuando hace frío.', respuesta: 'nieve' },
  { pregunta: 'Animal más grande de la tierra.', respuesta: 'elefante' }
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

      // ENVIAR MENSAJE
      const sentMsg =
        await sock.sendMessage(
          m.chat,
          {
            text:
`╭─〔 ADIVINANZA 〕─⬣

Pregunta:
${random.pregunta}

Tiempo: 1 minuto
Intentos: 3

Responde a ESTE mensaje.

╰────────────────⬣`
          },
          { quoted: m }
        )

      // GUARDAR
      juegosAdivinanza[m.chat] = {
        respuesta: random.respuesta.toLowerCase(),
        intentos: 3,
        id: sentMsg.key.id
      }

      // TEMPORIZADOR
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

Respuesta:
${respuesta}`
          }
        )

      }, 60000)

    } catch (e) {
      console.log(e)
      return m.reply('《✧》 Error.')
    }
  }
}

// DETECTOR
export const before = async (sock, m) => {

  try {

    const juego =
      juegosAdivinanza[m.chat]

    if (!juego) return

    // DETECTAR RESPUESTA
    const quoted =
      m.quoted

    if (!quoted) return

    // VALIDAR QUE RESPONDA AL BOT
    if (quoted.id !== juego.id) return

    const texto =
      (
        m.text ||
        m.body ||
        ''
      )
        .toLowerCase()
        .trim()

    if (!texto) return

    // CORRECTA
    if (texto === juego.respuesta) {

      await sock.sendMessage(
        m.chat,
        {
          text:
`《✧》 Correcto.

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

    // INCORRECTA
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
`《✧》 Incorrecto.

Intentos restantes:
${juego.intentos}`
      },
      { quoted: m }
    )

  } catch (e) {
    console.log(e)
  }
}
