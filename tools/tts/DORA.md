# Dora: generación persistente por lotes

La rama `codex/dora-batches` genera tres sesiones, valida los MP3 y sus subtítulos,
hace commit y push y recién entonces comienza el lote siguiente. No modifica main.
El progreso y los SHA-256 se guardan en `tools/tts/dora-progress.json`.
Al reintentar, se omiten exclusivamente las sesiones verificadas cuyo contenido
y guion todavía coinciden. Un push rechazado detiene el proceso sin forzarlo.

Voz: Kokoro-82M, ef_dora, español, velocidad base 0.82. Se conservan los silencios
de los guiones; no se añade reverberación a la voz. Los subtítulos se generan a
partir de grupos de frases de hasta 35 palabras. Es voz sintética, no la voz de Eli.

El workflow usa un runner estándar en este repositorio público. No usa servicios
de voz pagos. Los diez MP3 previos recuperados están en `recovered-dora/`; son
respaldo, y no se consideran sesiones completas porque faltaban sus subtítulos.

No fusionar esta rama hasta que `audio_complete` sea true, el build del workflow
haya terminado correctamente y se hayan integrado los cambios recientes de main.

Ejecución local de prueba:

```sh
bash tools/tts/dora-setup.sh
tools/tts/.venv/bin/python tools/tts/dora-batches.py --limit 3
```
