#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/pip install -r dora-requirements.txt
mkdir -p models
for file in kokoro-v1.0.onnx voices-v1.0.bin; do
  if [ ! -s "models/$file" ]; then
    curl --fail --location --retry 3 \
      "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1/$file" \
      -o "models/$file.partial"
    mv "models/$file.partial" "models/$file"
  fi
done
