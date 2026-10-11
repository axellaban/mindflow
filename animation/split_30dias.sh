#!/usr/bin/env bash
# Cuts the rendered inserts of reel_30dias.html (out/frames, drawn at 12 fps) into the three clips for the montage,
# at 30 fps to match Eli's video, into hyperframes/assets/brote/.
#   node render.mjs --page=reel_30dias.html --frames --fps=12 --workers=4   (add --soft-gl without a GPU)
#   ./split_30dias.sh
set -euo pipefail
cd "$(dirname "$0")"
OUT=../hyperframes/assets/brote
mkdir -p "$OUT"
clip() {   # name, first frame, frame count (at 12 fps), extra filters
  ffmpeg -y -loglevel error -framerate 12 -start_number "$2" -t "$(echo "$3 / 12" | bc -l)" -i out/frames/f%05d.jpg \
    -vf "${4:-null},fps=30" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart "$OUT/$1.mp4"
  echo "$OUT/$1.mp4"
}
clip insert-1-apuro 0 48     # 0–4 s
clip insert-2-pausa 48 48    # 4–8 s
clip insert-3-30dias 96 54   # 8–12.5 s
clip hook 150 30 "crop=900:900:90:550,scale=600:600:flags=lanczos"   # 12.5–15 s, the round bubble of the opening
