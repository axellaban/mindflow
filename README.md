# CalmabyEli (Mindflow)

Este repositorio reúne dos frentes complementarios:
1. **Web App CalmabyEli**: Aplicación web (PWA instalable) de [@mindfulnessbyeli](https://www.instagram.com/mindfulnessbyeli) para meditación femenina, desarrollada en React 19 + TypeScript + Vite y **deployada en Vercel**.
2. **Suite de Creación de Contenido & Animación (Reels / Social)**: Entornos integrados para producir contenido audiovisual y reels de mindfulness combinando:
   - **`animation/` ([ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase))**: Animación estilo acuarela y tinta artesanal con p5.js + p5.brush y Puppeteer (incluye el template vertical para reels de 30s y el personaje *Brote*).
   - **`hyperframes/` ([HyperFrames](https://github.com/heygen-com/hyperframes))**: Motor de HeyGen para componer y renderizar videos en MP4/WebM a partir de código web estándar (HTML, CSS, GSAP).
   - Ambas herramientas se utilizan conjuntamente para generar reels, historias animadas, intros y piezas de comunicación para Instagram, TikTok y YouTube.

Además de acompañar la práctica diaria, la app es la puerta de entrada a las **sesiones 1:1 con Eli** y a sus **workshops**, con invitaciones que aparecen en los momentos justos y sin presionar.

## Qué incluye

| Área | Detalle |
| --- | --- |
| **Programas** | *Bajar un cambio* (5 días: piloto automático, mente acelerada, autoexigencia, culpa y descanso, los temas que Eli trabaja en sus sesiones), *Aprender a meditar* (7 días), *Calmar la ansiedad* (5 días) y *Dormir profundo* (5 noches). |
| **Meditaciones** | 22 sesiones sueltas, entre ellas *Hacer las paces con tu cuerpo*, *Poner límites con amor*, *Cuando todo está en tu cabeza* (carga mental), *Días de período*, *Un respiro para mamás*, SOS ansiedad, pausa de 3 minutos, NSDR, café consciente… |
| **La pausa del día** | 12 meditaciones temáticas de 10 minutos que rotan cada día, con una frase para llevar. |
| **Historias para dormir** | 5 historias originales (tren patagónico, la guardiana del faro, biblioteca bajo la lluvia, cielo de Atacama, cabaña en la nieve) con un fondo sonoro que sigue sonando y se apaga solo. |
| **Reproductor** | Escena animada, subtítulos sincronizados, sonido de fondo con volumen propio, temporizador de sueño, controles en la pantalla bloqueada con la portada de cada sesión, descarga para escuchar sin conexión y pantalla de sesión completada con registro de ánimo. |
| **Respirar, temporizador, sonidos** | 6 patrones de respiración guiada, con una burbuja de vidrio que crece y se asienta con cada respiración sobre la playa; meditación en silencio con campanas; mezclador de 17 sonidos y 9 pistas de música generativa. |
| **Diario y progreso** | Check-in de ánimo con emociones (y una práctica recomendada según cómo estás), preguntas de reflexión, gráfico de ánimo, racha, calendario, 15 logros y favoritos. |
| **Personalización** | Onboarding con la presentación de Eli y la pregunta de su formulario (*¿Qué es lo que más te cuesta hoy?*): estrés, mente acelerada, autoexigencia, descanso, culpa… Con eso se arman el plan y las recomendaciones. |
| **Escenas** | La playa del inicio sigue la luz del día (amanecer, mediodía, atardecer y noche con luna y estrellas) y está viva: palmeras con viento, marea, nubes, luz del sol, reflejos y pájaros. Con "Reducir movimiento" solo cambia la luz. También se puede fijar cualquiera de las 14 escenas. |
| **Colores** | Turquesa de mar (paleta *Caribe*) de día; azul noche en Dormir, en las historias para dormir y en toda la app de 20 a 5 h (mientras la playa sigue la hora); coral para reproducir y para lo que se elige. |
| **Eli** | Página propia (`/eli`, con su foto en la vista previa al compartirla por Instagram o WhatsApp), invitaciones a sesiones 1:1 y al workshop, y WhatsApp directo con un primer mensaje ya escrito. |
| **PWA** | Instalable en iOS, Android y escritorio; funciona offline; se actualiza sola al abrirla o al pasar a segundo plano, sin cortar nunca una práctica ni un audio; si algún archivo no carga al abrirla, se repara sola o avisa y ofrece reintentar; recordatorio diario vía calendario (.ics); exportar/importar datos. |
| **Accesibilidad** | Contraste AA, lector de pantalla (diálogos con foco, fases de respiración anunciadas, títulos por pantalla), teclado en el reproductor y respeto por "Reducir movimiento". |

La interfaz habla con voseo, como Eli. Las narraciones usan una voz generada con IA, de acento latino neutro (*Luz*, la voz «marin» de OpenAI), en femenino hacia quien escucha.

## Invitaciones a las sesiones con Eli

Todo lo editable está en **`src/content/eli.ts`**: links, número de WhatsApp, credenciales, pasos de reserva, testimonios y el próximo workshop.

- **Agendar sesión** → formulario de Tally (`bookingForm`). Cada link lleva `utm_source=app` y `utm_content=<lugar>` (`home`, `completion`, `program`, `checkin`, `profile`, `settings`, `eli-page`) para saber qué invitación funciona mejor. Para verlo en Tally, agregá campos ocultos `utm_content` y `utm_campaign` al formulario.
- **WhatsApp** → `wa.me` directo al número que Eli publica en su formulario, con un primer mensaje ya escrito según el contexto (por ejemplo: *"¡Hola Eli! Soy Sofía, vengo de la app CalmabyEli 🌸 Me gustaría saber más sobre las sesiones 1:1. Me está costando la autoexigencia."*). La usuaria puede editarlo antes de enviarlo.
- **Workshop** → `EVENTS`: se muestra en el inicio y en `/eli` hasta la fecha de inicio y después desaparece solo. Para una nueva edición, agregá otro evento.
- **Dónde aparecen**:
  - En la pantalla de sesión completada, después de marcar el ánimo. Nunca en la primera sesión y como máximo cada 3 días. El texto cambia según el ánimo y el tema; si el día fue difícil, la invitación es a escribirle.
  - Al terminar un programa y en cada página de programa.
  - En el check-in, cuando aparecen emociones difíciles (como mucho cada 3 días).
  - Como tarjeta en el inicio y en el perfil.
  - En el avatar del encabezado, en la barra lateral de escritorio y en Ajustes.
- "Ahora no" pospone cada invitación (7 a 30 días según el lugar). Si la usuaria ya tocó un link de Eli, las invitaciones automáticas descansan unos días.
- **Fotos**: `public/eli/eli.webp` (retrato 4:5, ~440 px de ancho) y `public/eli/eli-avatar.webp` (cuadrada, 160 px). Hoy son recortes de las fotos de su sitio; reemplazalas por originales en WebP con el mismo nombre (la vista previa para compartir `/eli` se regenera con `tools/brand`).

## Stack

- **React 19 + TypeScript + Vite 8**, **Tailwind CSS 4**, **Motion** (animaciones), **Zustand** (estado persistente), **React Router**.
- **Web Audio API**: paisajes sonoros, música generativa, campanas y tono de respiración sintetizados en tiempo real (`src/audio`).
- **Narraciones** pre-generadas con la voz «marin» de OpenAI (`gpt-4o-mini-tts`) y verificadas frase por frase con una transcripción. MP3 en `public/audio`, subtítulos en `public/captions`.
- **Ilustraciones procedurales**: portadas y escenas se dibujan en SVG/canvas a partir de una paleta, un motivo y una semilla (`src/art`).
- **vite-plugin-pwa** (Workbox) para el service worker y el manifiesto.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # typecheck + build de producción en dist/
npm run preview    # sirve dist/ (con service worker)
```

## Despliegue (Web App en Vercel)

La aplicación web de **CalmabyEli** se compila como un sitio estático (`dist/`) y está configurada para **Vercel** mediante [`vercel.json`](vercel.json) (con soporte adicional para Netlify en [`netlify.toml`](netlify.toml)), resolviendo todas las rutas de la SPA hacia `index.html`.

El build genera además `robots.txt`, `sitemap.xml` y `eli/index.html` (la misma app con el título, la descripción y la imagen de Eli para las vistas previas de `/eli`). Las URLs absolutas salen de `SITE_URL` o, en Vercel, del dominio de producción del proyecto.

> **Nota de arquitectura:** Mientras que la web app se despliega en Vercel para las usuarias finales, las carpetas `animation/` y `hyperframes/` operan como entornos locales de producción audiovisual para crear el contenido que impulsa las redes y la comunidad.

## Creación de contenido y animación (Reels & Social)

El repositorio incorpora dos motores de animación que se combinan para producir reels (9:16), historias y videos de mindfulness:

### 1. `animation/` — Animación ilustrada artesanal (ClaudeAnimationBase)
Basado en [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase), utiliza **p5.js + p5.brush** con renderizado determinístico cuadro a cuadro vía Puppeteer.
- **Estilo:** Acuarela con textura de papel, trazos entintados vivos (*boil* a 12 fps), física de personajes y sin tipografías mecánicas.
- **Template vertical para Reels (30s):** Configurado en `src/config.reel.js` (1080×1920 a 60 BPM).
- **Personaje "Brote":** Variante mindfulness en tonos salvia, con postura de meditación en loto/zafu (`sit: true`) y brote en la cabeza con balanceo orgánico.
- **Guía y storyboard:** Consulta [`animation/ANIMATION_GUIDE.md`](animation/ANIMATION_GUIDE.md) y [`animation/STORYBOARD_REEL.md`](animation/STORYBOARD_REEL.md).
- **Comandos:**
  ```bash
  cd animation
  # Previsualizar interactivamente en Chrome:
  open -a "Google Chrome" reel.html
  # Exportar hoja de contactos para revisión:
  node render.mjs --page=reel.html --sheet=1,5,10,15,20,25,29 --cols=7 --w=240 --out=out/sheet.jpg
  # Renderizar video MP4 (30 s, 1080x1920):
  node render.mjs --page=reel.html --clip --out=out/reel_mindful.mp4
  ```

### 2. `hyperframes/` — Motion graphics y video en código web (HyperFrames)
Basado en [HyperFrames](https://github.com/heygen-com/hyperframes) de HeyGen, permite diseñar videos usando **HTML, CSS, SVG y GSAP** con renderizado acelerado por GPU (Metal en Apple Silicon).
- **Estilo:** Motion design moderno, tipografías nítidas, animaciones seekables reproducibles por cuadros, transiciones shader y sincronización exacta.
- **Skills IA:** Incluye skills integrados (`hyperframes`, `hyperframes-animation`, `hyperframes-audio`, `media-use`, `general-video`) para que agentes de IA asistan en la creación de escenas.
- **Comandos:**
  ```bash
  cd hyperframes
  npm run dev      # Inicia el Studio interactivo en vivo en el navegador
  npm run check    # Ejecuta validación de sintaxis, timeline, contrastes y layout
  npm run render   # Compila y renderiza la composición a MP4
  ```

### Reels con Brote (flujo repetible)
Para cada reel de Eli hay un flujo armado de punta a punta, que Claude Code sigue con la skill `reel-brote`
(`.claude/skills/reel-brote/SKILL.md`): mirar el video, proponer 3 opciones, storyboard, inserts de acuarela con Brote en
`animation/`, montaje en `hyperframes/reels/<reel>/` y render final normalizado para Instagram.
- `tools/reel/inspect.sh <video> <carpeta>`: formato, hoja de cuadros y los subtítulos quemados con su tiempo.
- `tools/reel/cut-clips.sh`: corta los cuadros de la animación en clips a 30 fps.
- `tools/reel/render.sh hyperframes/reels/<reel>`: valida, renderiza, normaliza el audio a −14 LUFS y deja una copia de menos de 30 MB.
- Primer reel: *Mindfulness 30 días* (`animation/STORYBOARD_30DIAS.md`, `hyperframes/reels/mindfulness-30-dias/`).
  El video de Eli no se sube al repo.

### ¿Cómo se combinan para crear contenido?
- **`animation/`** genera los clips y secuencias ilustradas de meditación, personajes (Brote) y metáforas visuales (respiración, calma, naturaleza).
- **`hyperframes/`** estructura el armado final del reel: overlays de texto, títulos de meditaciones de CalmabyEli, portadas, transiciones dinámicas y llamados a la acción para descargar la PWA o reservar sesiones 1:1 con Eli.

## Contenido y narraciones

Los guiones están en `content/scripts/*.txt` (pautas de escritura en `content/scripts/README.md`):

```
---
voice: luz          # la voz de la app
target: 10:00       # duración total; las pausas [*n] se estiran para llegar exacto
bells: start,end    # start,end | end | none
pace: 1.2           # opcional, más alto = más lento (desde 1.15, voz suave para dormir)
gaps: 1.4           # opcional, multiplica las pausas naturales entre frases
---
Texto de la narración. Cada oración es un subtítulo.
[5]        pausa fija en segundos
[*2]       pausa flexible (peso relativo)
[bell]     campana suave
Inhala{0.6} dos{0.6} tres.   pausas exactas dentro de una línea
```

Para regenerar el audio (necesita `OPENAI_API_KEY`):

```bash
tools/tts/setup.sh                                                   # entorno Python (una vez)
tools/tts/.venv/bin/python tools/tts/openai_voice.py --all          # solo narra lo que cambió
tools/tts/.venv/bin/python tools/tts/openai_voice.py pausa-soltar   # sesiones puntuales
```

Cada frase se transcribe y, si lo que se oye no coincide con el texto, se genera de nuevo; `tools/tts/openai-progress.json` registra lo verificado y las frases a revisar. En GitHub, el workflow *OpenAI narration* hace lo mismo con el secret `OPENAI_API_KEY`, narra lo que indique `tools/tts/openai-plan.txt` y sube el resultado por tandas.

El narrador genera el MP3, los subtítulos y `src/content/generated/audio-manifest.json`. Los metadatos de cada sesión (título, categorías, arte, fondo) viven en `src/content/catalog.ts`. `tools/tts/render.py` arma las sesiones (pausas, campanas, subtítulos) y, usado solo, narra gratis con Piper, pero reemplaza la voz de OpenAI.

## Herramientas internas

- `tools/audio-lab/`: con `npm run dev`, abrí `/tools/audio-lab/` para escuchar cada generador y medir su sonoridad.
- `tools/brand/`: genera los íconos PWA y las imágenes para redes, la general y la de `/eli` (`node tools/brand/render.mjs` con el servidor de desarrollo activo y Playwright; `ONLY=og-eli` para una sola).

## Estructura

```
src/
  audio/        motor Web Audio, generadores, campanas, narración
  art/          paletas, paisajes SVG, escenas animadas, portadas para la pantalla bloqueada
  content/      catálogo, programas, Eli (eli.ts), objetivos, sonidos, respiración, frases, logros, recomendaciones
  features/     eli (invitaciones), reproductor, respirar, temporizador, mezclador, onboarding, check-in
  pages/        inicio, meditar, dormir, sonidos, perfil, programa, tema, buscar, diario, ajustes, Eli
  store/        estado persistente (progreso, ajustes, diario, invitaciones) y reproductor
content/scripts/ guiones de las narraciones
tools/          renderizado de voz, laboratorio de audio, recursos de marca
```

## Aviso

Esta app acompaña, pero no reemplaza la atención profesional de salud mental. En Ajustes → Acerca de hay líneas de ayuda de Argentina.
