#!/usr/bin/env bash
# Cut rendered animation frames (drawn at 12 fps) into clips at 30 fps for the montage.
#   tools/reel/cut-clips.sh <frames dir> <out dir> name:first:count[:extra ffmpeg filters] ...
# Example: tools/reel/cut-clips.sh animation/out/frames reels/x/assets/brote insert-1:0:48 hook:150:30:crop=900:900:90:550
set -euo pipefail
FR=$1; OUT=$2; shift 2; mkdir -p "$OUT"
for spec in "$@"; do
  IFS=: read -r name first count vf <<< "$spec"
  ffmpeg -y -loglevel error -framerate 12 -start_number "$first" -t "$(echo "$count / 12" | bc -l)" -i "$FR/f%05d.jpg" \
    -vf "${vf:-null},fps=30" -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -movflags +faststart "$OUT/$name.mp4"
  echo "$OUT/$name.mp4"
done
