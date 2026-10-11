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

## Dónde va cada inserto en el video de Eli (a confirmar con el video en alta)

| Clip | Duración | Sobre la frase | Aprox. en el video actual |
|---|---|---|---|
| 1 · El apuro | 4,0 s | "…encontrás un rato para desconectar, te cuesta. Sentís culpa por no estar haciendo algo productivo" | ~6,5–10,5 s |
| 2 · La pausa | 4,0 s | "…necesitás aprender a hacer una pausa entre todo lo que ya hacés" | ~12,5–16,5 s |
| 3 · 30 días | 4,5 s | "…Mindfulness 30 días, un mes para practicar juntas" | ~17,5–22 s |

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

## Montaje (cuando llegue el video en alta, en `hyperframes/`)

1. Video de Eli sin subtítulos ni stickers, 1080×1920, de fondo durante todo el reel; su audio corre sin cortes.
2. Los 3 inserts se superponen encima de Eli en los momentos de la tabla, con una transición de entrada y otra de salida
   (~0,3 s, cortina de pincel o fundido) para pasar del video a la acuarela.
3. Encima de todo: subtítulos con la tipografía de la app (Jost + Cormorant Garamond), sin el error de tildes, y fuera de
   la zona de la UI de Instagram.
4. Tarjeta del programa ("Mindfulness 30 días · 1 de noviembre"), las tres características en orden y el cierre con el
   CTA bien visible: "Escribime NOVIEMBRE por DM".
