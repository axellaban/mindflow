# Guiones de narración

Cada archivo `.txt` es una sesión. El nombre del archivo es el `id` que usa `src/content/catalog.ts`.
Consulta el README principal para el formato y cómo renderizar el audio con `tools/tts/render.py`.

Pautas de escritura:
- Público: mujeres. Español neutro con trato de "tú" (la voz tiene acento neutro) y femenino hacia quien
  escucha ("bienvenida", "cómoda", "cuando estés lista").
- La interfaz de la app, en cambio, habla con voseo, como Eli.
- Frases cortas; números escritos en palabras; nada de abreviaturas.
- Evitá palabras muy cortas o pegadas que la voz sintética pronuncia poco claro (por ejemplo "dite eso":
  mejor "repite en silencio" o "háblate de esa manera"). Después de renderizar, conviene revisar con Whisper.
- Las meditaciones para dormir no usan campanas y terminan sin pedir que se abran los ojos.
