#!/usr/bin/env bash
# Cuts the rendered inserts of reel_30dias.html (out/frames, drawn at 12 fps) into the clips for the montage, at 30 fps
# to match Eli's video, into hyperframes/reels/mindfulness-30-dias/assets/brote/.
#   node render.mjs --page=reel_30dias.html --frames --fps=12 --workers=2   (add --soft-gl without a GPU)
#   ./split_30dias.sh
set -euo pipefail
cd "$(dirname "$0")"
../tools/reel/cut-clips.sh out/frames ../hyperframes/reels/mindfulness-30-dias/assets/brote \
  insert-1-apuro:0:48 insert-2-pausa:48:48 insert-3-30dias:96:54 \
  hook:150:30:crop=900:900:90:550,scale=600:600:flags=lanczos   # 0–4, 4–8, 8–12.5 s and the round bubble (12.5–15 s)
