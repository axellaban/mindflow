# MindFlow — meditación, sueño y calma

Web app (PWA instalable) de bienestar mental inspirada en las mejores apps de meditación: meditaciones guiadas con voz, historias para dormir, respiración guiada, temporizador, paisajes sonoros y música que nunca se repite, diario de ánimo y seguimiento de progreso. Todo en español, sin registro y funcionando también sin conexión: 51 sesiones narradas (más de 8 horas de audio).

## Qué incluye

| Área | Detalle |
| --- | --- |
| **La pausa del día** | 12 meditaciones temáticas de 10 min (paciencia, aceptación, soltar, confianza…) que rotan cada día, con una frase para llevar. |
| **Programas** | *Aprende a meditar* (7 días), *Calma la ansiedad* (5 días) y *Duerme profundo* (5 noches), con progreso y "continuar". |
| **Meditaciones** | 17 sesiones sueltas: SOS ansiedad, pausa de 3 minutos, escaneo corporal, enfoque, NSDR (descanso profundo), metta, montaña, relajación progresiva, caminar, volver a dormir, café consciente, energía para empezar… |
| **Historias para dormir** | 5 historias originales (tren patagónico, faro, biblioteca bajo la lluvia, cielo de Atacama, cabaña en la nieve) con fondo sonoro que sigue sonando y se apaga solo. |
| **Reproductor** | Escena animada, subtítulos sincronizados, sonido de fondo elegible con volumen, temporizador de sueño, modo inmersivo, controles de pantalla bloqueada con la portada de cada sesión (Media Session), descarga para escuchar sin conexión y pantalla de sesión completada con registro de ánimo. |
| **Respirar** | Burbuja animada con 6 patrones (coherencia, 4‑7‑8, cuadrada, suspiro fisiológico, calma rápida, energía), tono guía que acompaña la respiración y vibración. |
| **Temporizador** | Meditación en silencio con campanas de inicio, intervalo y fin (cuenco, campana, gong, madera) y ambiente opcional. |
| **Sonidos** | Mezclador de 17 sonidos procedurales (lluvia, truenos, olas, lago, arroyo, viento, pájaros, grillos, fuego, tren, ventilador, ronroneo, campanillas, ruidos blanco/rosa/marrón), mezclas sugeridas y guardadas, y 9 pistas de música generativa (pads, piano, kalimba, cuencos, cristal, drones y ondas binaurales). |
| **Diario y progreso** | Check-in de ánimo con emociones y nota (y una práctica recomendada según cómo te sientes), preguntas de reflexión, gráfico de ánimo, racha, calendario, minutos, 15 logros, favoritos e historial. |
| **Personalización** | Onboarding con objetivos y experiencia → plan sugerido y recomendaciones según el momento del día. 8 escenas animadas para el inicio, con sonido. |
| **PWA** | Instalable en iOS/Android/escritorio, funciona offline, recordatorio diario vía calendario (.ics), exportar/importar datos. |

Los datos del usuario se guardan en el dispositivo (`localStorage`); no hay backend ni cuentas.

## Stack

- **React 19 + TypeScript + Vite 8**, **Tailwind CSS 4**, **Motion** (animaciones), **Zustand** (estado persistente), **React Router**.
- **Web Audio API**: todos los paisajes sonoros, la música generativa, las campanas y el tono de respiración se sintetizan en tiempo real (`src/audio`). Sin archivos de audio para esos sonidos.
- **Narraciones** pre-generadas con voces neuronales en español ([Piper](https://github.com/OHF-Voice/piper1-gpl)): *Luz* (`es_MX-claude-high`, Apache‑2.0) y *Mateo* (`es_ES-davefx-medium`, CC0). MP3 en `public/audio`, subtítulos en `public/captions`.
- **Ilustraciones procedurales**: cada portada y escena se dibuja en SVG/canvas a partir de una paleta, un motivo y una semilla (`src/art`). Ninguna imagen externa.
- **vite-plugin-pwa** (Workbox) para el service worker y el manifiesto.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # typecheck + build de producción en dist/
npm run preview    # sirve dist/ (con service worker)
```

## Despliegue

Es un sitio estático (`dist/`). Incluye configuración para **Vercel** (`vercel.json`) y **Netlify** (`netlify.toml`): ambos resuelven las rutas de la SPA hacia `index.html`. En cualquier otro hosting, configura el fallback de rutas a `index.html`.

## Contenido y narraciones

Los guiones están en `content/scripts/*.txt` con un formato simple:

```
---
voice: luz          # luz | mateo
target: 10:00       # duración total; las pausas [*n] se estiran para llegar exacto
bells: start,end    # start,end | end | none
pace: 1.2           # opcional, velocidad de la voz (más alto = más lento)
gaps: 1.4           # opcional, multiplica las pausas naturales entre frases
---
Texto de la narración. Cada oración es un subtítulo.
[5]        pausa fija en segundos
[*2]       pausa flexible (peso relativo)
[bell]     campana suave
Inhala{0.6} dos{0.6} tres.   pausas exactas dentro de una línea
```

Para regenerar el audio:

```bash
tools/tts/setup.sh                                   # entorno Python + voces (una vez)
tools/tts/.venv/bin/python tools/tts/render.py       # solo renderiza lo que cambió
tools/tts/.venv/bin/python tools/tts/render.py pausa-soltar --force
```

El renderizador genera el MP3, los subtítulos y `src/content/generated/audio-manifest.json` (duración exacta y hash de versión). Los metadatos de cada sesión (título, categorías, arte, fondo) viven en `src/content/catalog.ts`.

## Herramientas internas

- `tools/audio-lab/` — con `npm run dev`, abre `/tools/audio-lab/` para renderizar cada generador sin conexión y medir su sonoridad (se usó para calibrar `CALIBRATION` en `src/audio/engine.ts`).
- `tools/brand/` — genera los íconos PWA y la imagen para redes (`node tools/brand/render.mjs` con el servidor de desarrollo activo y Playwright).

## Estructura

```
src/
  audio/        motor Web Audio, generadores (naturaleza, hogar, música), campanas, narración
  art/          paletas, generador de paisajes SVG, escenas animadas en canvas
  content/      catálogo, programas, sonidos, respiración, frases, logros, recomendaciones
  features/     reproductor, respirar, temporizador, mezclador, onboarding, check-in
  pages/        inicio, meditar, dormir, sonidos, perfil, programa, tema, buscar, diario, ajustes
  store/        estado persistente (progreso, ajustes, diario) y reproductor
content/scripts/ guiones de las narraciones
tools/          renderizado de voz, laboratorio de audio, recursos de marca
```

## Aviso

MindFlow acompaña, pero no reemplaza la atención profesional de salud mental.
