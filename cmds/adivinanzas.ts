const juegosAdivinanza = global.juegosAdivinanza || (global.juegosAdivinanza = {})

const preguntas = [
  {
    pregunta: '🐾 Tiene cuatro patas, ladra y es el mejor amigo del hombre.',
    respuesta: 'perro'
  },
  {
    pregunta: '🍎 Fruta roja que cayó sobre Newton.',
    respuesta: 'manzana'
  },
  {
    pregunta: '🌞 Sale de día y ilumina la Tierra.',
    respuesta: 'sol'
  },
  {
    pregunta: '🐱 Animal que maúlla.',
    respuesta: 'gato'
  },
  {
    pregunta: '🚗 Vehículo de cuatro ruedas.',
    respuesta: 'carro'
  },
  {
    pregunta: '💧 Necesaria para vivir y transparente.',
    respuesta: 'agua'
  },
  {
    pregunta: '🕷️ Tiene ocho patas y hace telarañas.',
    respuesta: 'araña'
  },
  {
    pregunta: '🐘 Animal más grande de la tierra.',
    respuesta: 'elefante'
  },
  {
    pregunta: '🐓 Animal que canta al amanecer.',
    respuesta: 'gallo'
  },
  {
    pregunta: '🍌 Fruta amarilla y alargada.',
    respuesta: 'platano'
  },
  {
    pregunta: '❄️ Cae del cielo cuando hace mucho frío.',
    respuesta: 'nieve'
  },
  {
    pregunta: '🔥 Quema y da calor.',
    respuesta: 'fuego'
  },
  {
    pregunta: '🌙 Aparece de noche en el cielo.',
    respuesta: 'luna'
  },
  {
    pregunta: '🐟 Vive en el agua y tiene aletas.',
    respuesta: 'pez'
  },
  {
    pregunta: '📚 Lugar donde hay muchos libros.',
    respuesta: 'biblioteca'
  },
  {
    pregunta: '⌚ Sirve para saber la hora.',
    respuesta: 'reloj'
  },
  {
    pregunta: '🦁 Rey de la selva.',
    respuesta: 'leon'
  },
  {
    pregunta: '🍕 Comida italiana redonda.',
    respuesta: 'pizza'
  },
  {
    pregunta: '✈️ Vehículo que vuela por el cielo.',
    respuesta: 'avion'
  },
  {
    pregunta: '🌳 Tiene hojas y da sombra.',
    respuesta: 'arbol'
  },
  {
    pregunta: '🧊 Agua congelada.',
    respuesta: 'hielo'
  },
  {
    pregunta: '🐝 Produce miel.',
    respuesta: 'abeja'
  },
  {
    pregunta: '📱 Lo usas para llamar y enviar mensajes.',
    respuesta: 'telefono'
  },
  {
    pregunta: '👑 La usa un rey en la cabeza.',
    respuesta: 'corona'
  },
  {
    pregunta: '🌈 Tiene muchos colores y aparece después de la lluvia.',
    respuesta: 'arcoiris'
  }
]

export default {
  command: ['adivinanza', 'guess'],
  category: 'juegos',

  run: async (sock, m, args) => {
    try {

      if (juegosAdivinanza[m.chat]) {
        return m.reply(
          '《✧》 Ya hay una adivinanza en curso en este chat.'
        )
      }

      const random =
        preguntas[
          Math.floor(Math.random() * preguntas.length)
        ]

      juegosAdivinanza[m.chat] = {
        respuesta: random.respuesta.toLowerCase(),
        intentos: 3,
        jugador: m.sender
      }

      await sock.sendMessage(
        m.chat,
        {
          text:
`╭─〔 🎮 ADIVINANZA 🎮 〕─⬣

❓ ${random.pregunta}

⏳ Tiempo: 1 minuto
🎯 Intentos: 3

💬 Responde escribiendo la respuesta en el chat.

╰────────────────⬣`
        },
        { quoted: m }
      )

      setTimeout(async () => {

        if (juegosAdivinanza[m.chat]) {

          const respuesta =
            juegosAdivinanza[m.chat].respuesta

          delete juegosAdivinanza[m.chat]

          await sock.sendMessage(
            m.chat,
            {
              text:
`⏰ Se acabó el tiempo.

✅ La respuesta era: *${respuesta}*`
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

    const juego = juegosAdivinanza[m.chat]

    if (!juego) return

    if (m.sender !== juego.jugador) return

    const texto =
      (m.body || m.text || '')
        .toLowerCase()
        .trim()

    if (!texto) return

    if (texto === juego.respuesta) {

      await sock.sendMessage(
        m.chat,
        {
          text:
`🎉 ¡Correcto!

👤 @${m.sender.split('@')[0]}
✅ La respuesta era: *${juego.respuesta}*`,
          mentions: [m.sender]
        },
        { quoted: m }
      )

      delete juegosAdivinanza[m.chat]
      return
    }

    juego.intentos--

    if (juego.intentos <= 0) {

      await sock.sendMessage(
        m.chat,
        {
          text:
`❌ Se acabaron los intentos.

✅ La respuesta correcta era: *${juego.respuesta}*`
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
`❌ Respuesta incorrecta.

🎯 Intentos restantes: ${juego.intentos}`
      },
      { quoted: m }
    )

  } catch (e) {
    console.log(e)
  }
}
