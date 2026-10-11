---
name: reel-brote
description: Turn a reel (a video of Eli or anyone talking to camera) into a finished CalmabyEli reel with Brote's watercolour inserts, a hook, captions and a closing call to action. Use whenever the user shares a reel / video and asks to animate it, add Brote, "hacer lo mismo que con el de 30 días", or make a reel for @mindfulnessbyeli.
---

# Reel con Brote

The pipeline built for the "Mindfulness 30 días" reel (see `animation/STORYBOARD_30DIAS.md` and
`hyperframes/reels/mindfulness-30-dias/`), made repeatable. Talk to the user in Spanish with voseo, like the app.
The two tools: `animation/` (p5.brush watercolour, Brote) for the inserts and `hyperframes/` (HTML + GSAP) for the montage.

## 0. Ground rules

- **Propose before building.** After looking at the video, give the user 3 options (e.g. graphics over the footage only /
  Eli + watercolour inserts / fully animated with her audio) with a recommendation, and wait for their pick.
- **Ask for the raw footage**: the phone's original file, without captions or stickers, sent as a *document* (WhatsApp
  compresses videos to ~480×850). If they only have an edited version, build on it: then our captions only appear over
  the inserts, and nothing goes where her burned-in captions sit (~65–75 % of the height).
- **Eli's footage never goes in git** (`hyperframes/reels/*/assets/eli/` and `renders/` are ignored).
- Brote is a soft, slightly squashed sage ball with floating ball hands and a sprout on top (`brote()` in
  `animation/src/scenes/reel_30dias.js`). Keep her on model. Never the square Clawd body.
- Palette from the app (`src/styles/index.css`): coral `#FF8F7C` (rush; use `#D4543F` behind white text for contrast),
  sage/turquoise `#94CDC5` `#6AA7A1` (calm), mint `#C3E6DF`, cream `#FFF5E2`, paper `#F3EBDC`, ink `#2B2233`.
  Fonts: Jost + Cormorant Garamond italic (woff2 in each reel's `assets/fonts`).

## 1. Look at the video

```bash
tools/reel/inspect.sh <video> <scratch>/inspect      # info.txt, sheet.jpg, captions-NN.jpg
```

Read every image. With burned-in captions, `captions-NN.jpg` gives each word with its time (add the image's start
offset), which is how you get a transcript and timings: speech-to-text models can't be downloaded in cloud sessions
(Hugging Face and the Whisper host are blocked). Without captions, try `pip install faster-whisper` once; if the model
download fails, ask the user for the script or read the lips/timing from the sheet as best you can, and say so.

Write down: what she says (with times), the program/offer, the CTA, problems (resolution, caption typos, clutter).

## 2. Storyboard

Write `animation/STORYBOARD_<SLUG>.md` (Spanish), modelled on `STORYBOARD_30DIAS.md`: logline, motif, colour arc,
Brote's emotion arc, and for each insert its place in her video (the exact phrase it covers) and its *reads* with
times. Rules that worked:
- 3 inserts of 4–4.5 s on the key phrases (the problem, the turn, the promise) plus a 2.5 s **hook** bubble in the first
  second. Keep her face on the hook question and on the program's name.
- Land the payoff of each insert on a word (Brote closes her eyes on "pausa", the flower opens on "meditación").
- No text inside the paintings; action between y≈450 and y≈1400 of 1920; leave the floor (y > ~1300) for captions.
- Follow `animation/ANIMATION_GUIDE.md` (read it): an event in every shot, one read at a time, acted emotions.

## 3. Paint the inserts

- Copy `animation/src/scenes/reel_30dias.js` → `reel_<slug>.js` (keep the CHARACTER, SET and TASKS sections, write new
  shots) and `reel_30dias.html` → `reel_<slug>.html` (set `PROJECT.duration` to the sum of the shots).
- `cd animation && npm install` once per session.
- **Cloud sessions have no GPU** (WebGL in software): ~8 s per frame. Every watercolour `fill` costs ~3 s a frame and
  every wash ~0.5 s; ink lines are free. So: paper + a few washes for sets, detail in linework, ≤ 2 fills besides Brote.
- Check stills first (the sheet's ms/frame numbers are not the real cost; trust the full render):
  `node render.mjs --page=reel_<slug>.html --chrome=/opt/pw-browsers/chromium --soft-gl --sheet=0.5,1.5,... --cols=6 --w=300 --out=out/check/x.jpg`
- Render at 12 drawings a second (hand-drawn "on twos"), **2 workers** (4 time out loading in software GL), in the
  background; ~150 frames ≈ 20 min:
  `node render.mjs --page=reel_<slug>.html --chrome=/opt/pw-browsers/chromium --soft-gl --frames --fps=12 --workers=2`
  Re-render only what changed with `--range=a:b` after deleting those frames from `out/frames`.
- Tile every frame of each clip into one image and look at it before moving on.
- Cut the clips (12 fps → 30 fps) into the reel's project:
  `tools/reel/cut-clips.sh animation/out/frames hyperframes/reels/<slug>/assets/brote insert-1:0:48 ... hook:150:30:crop=900:900:90:550,scale=600:600:flags=lanczos`
  (`-t`-based, so a 48-frame clip lasts 4 s; never cut with `-frames:v`).

## 4. Montage (HyperFrames)

- New project: `cp -r hyperframes/reels/mindfulness-30-dias hyperframes/reels/<slug>`, delete its `assets/brote/*`,
  `assets/eli/*`, `renders/`, and edit `meta.json`. Put her video, upscaled, in `assets/eli/`:
  `ffmpeg -i <video> -vf "scale=1080:1920:flags=lanczos,unsharp=5:5:0.4" -c:v libx264 -preset slow -crf 17 -c:a aac -b:a 192k assets/eli/base.mp4`
- Edit `index.html` (it is the 30 días reel: reuse its structure). What it has, and why:
  - her video full-frame with `data-has-audio="true"`; inserts `muted`, each with its own reveal (iris on Brote,
    a rising `inset()` fill like an in-breath, iris on the flower);
  - captions over the inserts only while the painting already covers the caption band (time them against the reveal),
    bold uppercase Jost, ink on the cream floor;
  - the hook bubble (`#hook`, round, cream + sage ring) clear of her captions;
  - the CTA pill (`#dm`) over her head while she says it, the key word pulsing on the word;
  - a short closing card (≈2.3 s) with `brote-flor.jpg`, the program, the date, the CTA and a soft bell
    (`assets/sfx/campana.m4a`, `data-volume` ≈ 0.08).
- GSAP and fonts must be **local** (`assets/vendor`, `assets/fonts`): the render browser can't reach CDNs.
- `npx hyperframes@0.8.145 check hyperframes/reels/<slug>` must pass (contrast included), then snapshot the transitions
  and key moments (`snapshot <dir> --at ... --no-end`) and look at them. Set `HYPERFRAMES_BROWSER_PATH` to
  `/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell` in cloud sessions (render.sh does it).

## 5. Render and deliver

```bash
tools/reel/render.sh hyperframes/reels/<slug>    # check + render + −14 LUFS + a <30 MB copy
```

Look at a tiled sheet of the final file, check loudness, then send `renders/<slug>-chat.mp4` with SendUserFile
(the chat limit is 30 MB) and tell the user they can download it from that card. Commit the scene, storyboard, html
and the Brote clips (not her footage), push, and give an honest rating with what would make it better.
