#!/usr/bin/env python3
"""
Separate test: the opening of "Aprender a meditar, día 1" narrated with OpenAI voices.

Reuses render.py's assembly (pauses, bell, levels, MP3 encoding) so the samples can be
compared with the Piper and Dora ones. Does not touch public/ or the manifest.

    OPENAI_API_KEY=... python tools/tts/openai_test.py
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np

import render as r

r.SR = 24000  # the API returns 24 kHz PCM
r.PARAGRAPH_GAP = 3.0
r.voice_space = lambda audio: audio  # dry voice, like the Dora samples
_bell = r.bell
r.bell = lambda f0, peak_db, **kw: _bell(f0, min(peak_db, -23.0), **kw)

MODEL = "gpt-4o-mini-tts"
VOICES = ["marin", "sage", "coral"]
INSTRUCTIONS = (
    "Voice: a warm, gentle female meditation guide speaking Spanish.\n"
    "Accent: neutral Latin American Spanish, with seseo; never the Castilian 'th' sound.\n"
    "Pace: slow and unhurried, with soft natural pauses at commas.\n"
    "Tone: calm, intimate and reassuring, as if guiding one person in a quiet room.\n"
    "Avoid: sounding dramatic, cheerful, salesy or like a radio announcer."
)
PASSAGE = """---
voice: luz
bells: start
---
Hola, bienvenida al primer día de Aprender a meditar.
Durante esta semana vamos a construir, paso a paso, una práctica sencilla que puedas llevar contigo a cualquier parte.
Hoy empezamos por lo más básico, y también lo más poderoso: la respiración.

Busca una postura cómoda, que al mismo tiempo mantenga tu atención despierta.
Si estás en una silla, apoya bien los pies en el suelo. Deja que las manos descansen sobre los muslos.
Imagina que un hilo muy fino tira suavemente de la coronilla hacia arriba, y deja que todo lo demás se afloje.
[3]
"""
OUT = Path(__file__).resolve().parent / "openai-test"


class OpenAISynth:
    def __init__(self, voice: str):
        self.voice = voice

    def say(self, _voice: str, text: str, _pace: float | None) -> np.ndarray:
        body = json.dumps({
            "model": MODEL,
            "voice": self.voice,
            "input": r.prepare_text(text),
            "instructions": INSTRUCTIONS,
            "response_format": "pcm",
        }).encode()
        for attempt in range(4):
            request = urllib.request.Request(
                "https://api.openai.com/v1/audio/speech",
                data=body,
                headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": "application/json"},
            )
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    pcm = response.read()
                break
            except urllib.error.HTTPError as error:
                if error.code not in (429, 500, 502, 503) or attempt == 3:
                    raise SystemExit(f"OpenAI {error.code}: {error.read().decode()[:300]}")
                time.sleep(2**attempt)
        return r.trim(np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768)


def main() -> None:
    if not os.environ.get("OPENAI_API_KEY"):
        sys.exit("Missing OPENAI_API_KEY")
    OUT.mkdir(exist_ok=True)
    passage = OUT / "muestra.txt"
    passage.write_text(PASSAGE, encoding="utf-8")
    script = r.parse_script(passage)
    passage.unlink()
    ffmpeg = r.find_ffmpeg()
    for n, voice in enumerate(VOICES, start=4):
        samples, meta = r.render(script, OpenAISynth(voice))
        out = OUT / f"{n}-openai-{voice}.mp3"
        r.encode_mp3(samples, out, ffmpeg)
        print(f"{out.name}: {meta['duration']} s", flush=True)


if __name__ == "__main__":
    main()
