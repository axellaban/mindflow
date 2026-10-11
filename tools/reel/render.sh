#!/usr/bin/env bash
# Check, render and finish one reel project (hyperframes/reels/<slug>).
#   tools/reel/render.sh hyperframes/reels/<slug>
# Writes renders/<slug>.mp4 (straight from HyperFrames), renders/<slug>-final.mp4 (audio at −14 LUFS, Instagram's
# level) and renders/<slug>-chat.mp4 (under 30 MB, to send through a chat or WhatsApp).
set -euo pipefail
DIR=$(cd "$1" && pwd); SLUG=$(basename "$DIR"); HF="npx --yes hyperframes@0.8.145"
# no system Chrome in cloud sessions: use the Playwright headless shell if it's there
for b in /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell; do [ -x "$b" ] && export HYPERFRAMES_BROWSER_PATH=${HYPERFRAMES_BROWSER_PATH:-$b}; done
cd "$DIR"; mkdir -p renders
$HF check . 2>&1 | grep -E "✗|error\(s\)|passed|failed"
$HF render . -o "renders/$SLUG.mp4" --workers 4 --quality high > renders/render.log 2>&1 || { tail -20 renders/render.log; exit 1; }
ffmpeg -v error -y -i "renders/$SLUG.mp4" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 192k -movflags +faststart "renders/$SLUG-final.mp4"
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "renders/$SLUG-final.mp4")
VB=$(echo "24 * 8192 / $D - 200" | bc)   # ~24 MB in total, 192 kb/s of it audio
(cd renders && ffmpeg -v error -y -i "$SLUG-final.mp4" -c:v libx264 -preset slow -b:v "${VB}k" -pass 1 -an -f null /dev/null \
  && ffmpeg -v error -y -i "$SLUG-final.mp4" -c:v libx264 -preset slow -b:v "${VB}k" -pass 2 -pix_fmt yuv420p -c:a copy -movflags +faststart "$SLUG-chat.mp4"; rm -f ffmpeg2pass*)
ls -la renders/*.mp4
ffmpeg -i "renders/$SLUG-final.mp4" -vn -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | tail -1
