#!/usr/bin/env bash
# Look at a reel before touching it: format, a contact sheet and the burned-in captions with timestamps.
#   tools/reel/inspect.sh <video> <out dir> [caption band y] [caption band h]
# Writes <out>/info.txt, <out>/sheet.jpg (a frame every 2 s) and <out>/captions-NN.jpg (the caption band at 8 fps,
# each strip stamped with its time), so the words and their timing can be read even with no speech-to-text.
# The caption band defaults to 65–74 % of the height, where Instagram/CapCut captions usually sit.
set -euo pipefail
V=$1; OUT=$2; mkdir -p "$OUT"
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$V")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$V")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
Y=${3:-$((H * 65 / 100))}; BH=${4:-$((H * 9 / 100))}
{ ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate,sample_rate -of compact "$V"
  ffmpeg -i "$V" -vn -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | tail -1; } > "$OUT/info.txt"
ffmpeg -v error -y -i "$V" -vf "fps=1/2,scale=200:-1,tile=8x$(( (${D%.*} / 2 + 8) / 8 ))" -frames:v 1 "$OUT/sheet.jpg"
n=0
for ((s = 0; s < ${D%.*} + 1; s += 18)); do   # 18 s per image: 6 columns × 24 rows at 8 fps
  n=$((n + 1))
  ffmpeg -v error -y -ss "$s" -t 18 -i "$V" -vf "fps=8,crop=$W:$BH:0:$Y,scale=300:-1,drawtext=text='%{pts\:flt}':x=2:y=2:fontsize=12:fontcolor=yellow,tile=6x24" \
    -frames:v 1 "$OUT/captions-$(printf %02d $n).jpg"
  echo "captions-$(printf %02d $n).jpg starts at ${s}s (add it to the stamped times)" >> "$OUT/info.txt"
done
cat "$OUT/info.txt"
