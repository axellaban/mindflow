# Inserts de acuarela para el reel "Mindfulness 30 días" (Eli + Brote)

El reel es Eli hablando a cámara (40 s, 9:16). Entre sus frases cortamos a tres escenas ilustradas, de 4 a 4,5 s cada una,
mientras su voz sigue sonando. Las escenas no llevan texto: los subtítulos del montaje (HyperFrames) siguen por encima.

- Render: `reel_30dias.html` (12,5 s = las tres escenas seguidas). Se cortan en 3 clips con `./split_30dias.sh` (quedan en `hyperframes/assets/brote/`).
- Dibujos a 12 por segundo ("en dos", como la animación hecha a mano), exportados a 30 fps para empatar con el video de Eli.
- Safe zone de Reels: la acción vive entre y≈450 y y≈1400; debajo quedan los subtítulos y la UI de Instagram.
- Paleta de CalmabyEli: coral (#FF8F7C, apuro), turquesa/salvia (#94CDC5, #6AA7A1, calma), crema y papel. Brote en salvia.
- Brote: una bolita redonda, apenas aplastada, con manitos-bolita que flotan a los costados y un brote en la cabeza
  (más mindfulness que el bloque de Clawd). Usa las caras, emociones y emotes del kit; el cuerpo se dibuja en `reel_30dias.js`.

Logline: Brote quiere descansar pero las tareas no la dejan; se detiene, respira y las suelta; con 30 días de práctica, su brote florece.

Motif: la órbita. Las tareas giran alrededor de Brote (apuro) → se frenan y se van (pausa) → la órbita se vuelve un anillo de 30 brotes (práctica).
Color: la mancha detrás de Brote pasa de durazno/coral (apuro) a turquesa (calma) y a menta luminosa (florece).
Brote: relieved → peek → nervous → dizzy | dizzy → ojos cerrados (respira) → relieved | calma → hopeful (mira su flor).

## Dónde va cada inserto en el video de Eli (montaje en `hyperframes/index.html`)

| Clip | En el video | Sobre la frase |
|---|---|---|
| 1 · El apuro | 6,6–10,6 s | "te cuesta desconectar o sentir culpa por no estar haciendo algo productivo" |
| 2 · La pausa | 13,0–17,0 s | "necesitás aprender a hacer una pausa entre todo lo que ya hacés" (Brote cierra los ojos en "pausa") |
| 3 · 30 días | 19,0–23,5 s | "durante un mes vamos a practicar juntas cómo incorporar meditación a tu vida diaria" (florece en "meditación") |

Las transiciones video ↔ acuarela se hacen en el montaje (HyperFrames), así que cada clip abre y cierra con la escena llena
(sin cortinas propias) y deja ~0,3 s de margen para el cruce.

## Shots

```
1  0.0–4.0  El apuro. Brote sentada en su cojín quiere descansar; las tareas aparecen y giran cada vez más rápido.
   reads: 0.0–0.7  Brote en el cojín, ojos cerrados, tranquila
          0.7–1.2  vibra un celular a su lado (aparece con un pop) · Brote abre un ojo
          1.2–1.6  el celular empieza a girar alrededor; Brote lo sigue con la mirada, nerviosa (gotita)
          1.6–2.7  se suman la laptop, la lista, el café y el reloj, uno por vez; la órbita acelera
          2.7–4.0  ya es demasiado: Brote mareada (ojos espiral) en el centro del remolino; la mancha se pone coral

2  0.0–4.0  La pausa. El mismo remolino (continuidad). Brote se detiene y respira.
   reads: 0.0–0.6  remolino a toda velocidad, Brote mareada
          0.6–0.9  Brote cierra los ojos (take chico)
          0.9–2.2  inhala: el cuerpo se estira, los brazos suben, crece un círculo turquesa detrás; las tareas frenan y flotan
          2.2–3.4  exhala: las tareas suben y se alejan, achicándose, y desaparecen con un brillo; la mancha pasa a turquesa
          3.0–4.0  Brote sonríe, en calma, sola en su cojín con el círculo respirando

3  0.0–4.5  30 días. Brote medita; alrededor, un anillo de 30 semillas (un mes). Un solcito recorre el anillo y cada
            semilla brota a su paso; el brote de Brote crece y al completar el círculo florece en coral.
   reads: 0.0–0.6  Brote meditando, el anillo de puntitos alrededor
          0.6–3.1  el sol recorre el anillo en sentido horario; detrás de él brota un brote por día (30); el de Brote crece
          3.1–3.6  círculo completo: la flor de Brote se abre en coral, los 30 brotes echan un botón coral
          3.6–4.5  Brote mira su flor, ilusionada; brillo cálido; hold para que se lea
```

## Montaje (`hyperframes/index.html`)

1. Base: la edición de Eli (720×1280, con sus subtítulos y stickers) escalada a 1080×1920; su audio corre sin cortes.
   El archivo va en `hyperframes/assets/eli/reel-30dias-base.mp4` y queda fuera de git.
2. Gancho (0,15–2,65 s): Brote, ya con las tareas girando, en una burbuja redonda junto a la pregunta inicial de Eli
   (shot `hook` de `reel_30dias.js`, 12,5–15 s, recortado en círculo por `split_30dias.sh`).
3. Transiciones distintas por clip: iris sobre Brote (apuro), relleno que sube como una inhalación (pausa), iris sobre la flor (30 días).
4. Mientras está Brote, subtítulos propios en mayúsculas (Jost, tinta sobre el piso crema), cerca del estilo de los de Eli;
   aparecen solo cuando la acuarela ya cubre esa zona, para que no se pisen con los de ella.
5. CTA arriba de Eli mientras dice "mandame por DM la palabra noviembre" (36,9–40,4 s); NOVIEMBRE late cuando lo nombra.
6. Cierre de 2,35 s con una campana suave: Brote florecida, "Mindfulness 30 días", "Empieza el 1 de noviembre" y el CTA.
7. Audio final normalizado a −14 LUFS (el de Instagram).

Render: `HYPERFRAMES_BROWSER_PATH=<headless_shell> npx hyperframes@0.8.145 render . -o renders/reel-mindfulness-30-dias.mp4`
