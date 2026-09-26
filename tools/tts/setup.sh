#!/usr/bin/env bash
# Downloads the Piper voices used by the app into tools/tts/models and
# creates a Python virtualenv with the renderer's dependencies.
set -euo pipefail
cd "$(dirname "$0")"
python3 -m venv .venv
./.venv/bin/pip install -q -r requirements.txt
mkdir -p models
for voice in es_MX-claude-high es_ES-davefx-medium; do
  if [ ! -d "models/vits-piper-$voice" ]; then
    echo "Downloading $voice…"
    curl -sSL "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-$voice.tar.bz2" | tar xj -C models
  fi
done
echo "Listo. Renderiza con: tools/tts/.venv/bin/python tools/tts/render.py"
