# Dora: generación persistente por lotes

La rama `codex/dora-batches` genera tres sesiones, valida los MP3 y sus subtítulos,
hace commit y push y recién entonces comienza el lote siguiente. No modifica main.
El progreso y los SHA-256 se guardan en `tools/tts/dora-progress.json`.
Al reintentar, se omiten exclusivamente las sesiones verificadas cuyo contenido
y guion todavía coinciden. Un push rechazado detiene el proceso sin forzarlo.

Voz: Kokoro-82M, ef_dora, español latinoamericano (`es-419`), velocidad base 0.82.
Versión `dora-batches-v2-es419`: invalida los audios y cachés anteriores con `es`.
Se conservan los silencios
de los guiones; no se añade reverberación a la voz. Los subtítulos se generan a
partir del separador original, frase por frase, con sus pausas de 0,8 a 1,35 segundos.
Es voz sintética, no la voz de Eli.

El workflow usa un runner estándar en este repositorio público. No usa servicios
de voz pagos. Se instala ffmpeg (incluido ffprobe) antes de generar y validar.
Los diez MP3 recuperados con acento de España fueron retirados de esta rama;
`recovered-dora/` no debe incorporarse a main.

No fusionar esta rama hasta que `audio_complete` sea true, el build del workflow
haya terminado correctamente y se hayan integrado los cambios recientes de main.

Ejecución local de prueba:

```sh
bash tools/tts/dora-setup.sh
tools/tts/.venv/bin/python tools/tts/dora-batches.py --limit 3
```
