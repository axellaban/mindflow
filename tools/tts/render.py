#!/usr/bin/env python3
"""
CalmabyEli narration renderer.

Turns the plain-text scripts in content/scripts/*.txt into finished audio:

    public/audio/<id>.mp3          narrated session (voice + singing-bowl bells)
    public/captions/<id>.json      sentence-level captions and cues for the player
    src/content/generated/audio-manifest.json   exact durations + version hashes

Script format (see content/scripts/README.md):

    ---
    voice: luz            # luz | mateo
    target: 10:00         # optional total length (mm:ss); flexible pauses stretch to fit
    bells: start,end      # start,end | end | none
    pace: 1.12            # optional Piper length_scale (bigger = slower)
    ---
    A paragraph of narration. Each sentence becomes one caption.

    [6]        fixed pause, seconds (replaces the paragraph gap)
    [*2]       flexible pause, relative weight (fills the target duration)
    [bell]     soft bell strike in the middle of a session

Usage:
    python tools/tts/render.py                # render everything that changed
    python tools/tts/render.py pausa-soltar   # render specific ids
    python tools/tts/render.py --force        # ignore the output cache
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import wave
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "content" / "scripts"
AUDIO_DIR = ROOT / "public" / "audio"
CAPTIONS_DIR = ROOT / "public" / "captions"
MANIFEST = ROOT / "src" / "content" / "generated" / "audio-manifest.json"
CACHE_DIR = Path(__file__).resolve().parent / ".cache"

SR = 22050
PIPELINE_VERSION = "3"

VOICES = {
    # name: (piper model id, length_scale, noise_scale, noise_w)
    "luz": ("es_MX-claude-high", 1.14, 0.62, 0.7),
    "mateo": ("es_ES-davefx-medium", 1.12, 0.6, 0.7),
}

SENTENCE_GAP = 0.8
QUESTION_GAP = 0.95
ELLIPSIS_GAP = 1.35
PARAGRAPH_GAP = 1.9
MIN_FLEX = 2.5


# --------------------------------------------------------------------------- parsing


@dataclass
class Speech:
    text: str
    gap: float  # silence after this sentence


@dataclass
class Pause:
    seconds: float = 0.0
    weight: float = 0.0  # > 0 means flexible


@dataclass
class Bell:
    kind: str = "mid"


@dataclass
class Script:
    id: str
    voice: str = "luz"
    target: float | None = None
    bells: set[str] = field(default_factory=lambda: {"start", "end"})
    pace: float | None = None
    gaps: float = 1.0  # multiplier for the natural pauses between sentences/paragraphs
    events: list = field(default_factory=list)


def parse_time(value: str) -> float:
    value = value.strip()
    if ":" in value:
        m, s = value.split(":")
        return int(m) * 60 + float(s)
    return float(value)


SENTENCE_RE = re.compile(r"(.+?(?:\.\.\.|…|[.?!])(?:[»\"”)]*)?)(?=\s+|$)", re.S)
INLINE_PAUSE_RE = re.compile(r"\{([\d.]+)\}")


def _split_plain(text: str) -> list[tuple[str, float]]:
    out: list[tuple[str, float]] = []
    pos = 0
    for m in SENTENCE_RE.finditer(text):
        chunk = m.group(1).strip()
        pos = m.end()
        if not chunk:
            continue
        end = chunk.rstrip("»\"”) ")
        if end.endswith("…") or end.endswith("..."):
            gap = ELLIPSIS_GAP
        elif end.endswith("?") or end.endswith("!"):
            gap = QUESTION_GAP
        else:
            gap = SENTENCE_GAP
        out.append((chunk, gap))
    rest = text[pos:].strip()
    if rest:
        out.append((rest, SENTENCE_GAP))
    return out


def split_sentences(paragraph: str) -> list[tuple[str, float]]:
    """Sentences with the silence that follows each one.

    `{0.6}` inside a line cuts the phrase there and inserts exactly that pause,
    which is handy for counted breathing ("Inhala{0.5} dos{0.5} tres").
    """
    paragraph = re.sub(r"\s+", " ", paragraph).strip()
    parts = INLINE_PAUSE_RE.split(paragraph)
    out: list[tuple[str, float]] = []
    for i in range(0, len(parts), 2):
        text = parts[i].strip()
        pieces = _split_plain(text) if text else []
        if i + 1 < len(parts) and pieces:
            last_text, _ = pieces[-1]
            pieces[-1] = (last_text, float(parts[i + 1]))
        out.extend(pieces)
    return out


def parse_script(path: Path) -> Script:
    raw = path.read_text(encoding="utf-8")
    script = Script(id=path.stem)
    body = raw
    if raw.startswith("---"):
        _, header, body = raw.split("---", 2)
        for line in header.strip().splitlines():
            line = line.split("#", 1)[0].strip()
            if not line:
                continue
            key, value = [p.strip() for p in line.split(":", 1)]
            if key == "voice":
                script.voice = value
            elif key == "target":
                script.target = parse_time(value)
            elif key == "bells":
                script.bells = set() if value == "none" else {v.strip() for v in value.split(",")}
            elif key == "pace":
                script.pace = float(value)
            elif key == "gaps":
                script.gaps = float(value)
    if script.voice not in VOICES:
        raise SystemExit(f"{path.name}: unknown voice '{script.voice}'")

    events: list = []
    paragraph: list[str] = []

    def flush(explicit_pause: bool) -> None:
        if not paragraph:
            return
        sentences = split_sentences(" ".join(paragraph))
        paragraph.clear()
        for i, (text, gap) in enumerate(sentences):
            last = i == len(sentences) - 1
            if last:
                gap = 0.0 if explicit_pause else max(gap, PARAGRAPH_GAP)
            events.append(Speech(text=text, gap=gap * script.gaps))

    for line in body.splitlines():
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        marker = re.fullmatch(r"\[(\*?)([\d.]+)\]", stripped)
        if marker:
            flush(explicit_pause=True)
            if marker.group(1):
                events.append(Pause(weight=float(marker.group(2))))
            else:
                events.append(Pause(seconds=float(marker.group(2))))
            continue
        if stripped == "[bell]":
            flush(explicit_pause=True)
            events.append(Bell())
            continue
        if not stripped:
            flush(explicit_pause=False)
            continue
        if stripped.endswith(":"):
            stripped += "{0.7}"  # a line that introduces the next one gets a short beat
        paragraph.append(stripped)
    flush(explicit_pause=False)

    # A trailing paragraph gap before the outro is not needed.
    if events and isinstance(events[-1], Speech):
        events[-1].gap = 0.0
    script.events = events
    return script


# --------------------------------------------------------------------------- synthesis


class Synth:
    def __init__(self, models_dir: Path):
        self.models_dir = models_dir
        self._voices: dict = {}

    def voice(self, name: str):
        if name not in self._voices:
            from piper import PiperVoice

            model_id = VOICES[name][0]
            base = self.models_dir / f"vits-piper-{model_id}" / model_id
            self._voices[name] = PiperVoice.load(f"{base}.onnx", config_path=f"{base}.onnx.json")
        return self._voices[name]

    def say(self, voice_name: str, text: str, pace: float | None) -> np.ndarray:
        from piper import SynthesisConfig

        model_id, length_scale, noise_scale, noise_w = VOICES[voice_name]
        if pace:
            length_scale = pace
        spoken = prepare_text(text)
        key = hashlib.sha1(
            f"{model_id}|{length_scale}|{noise_scale}|{noise_w}|{spoken}".encode()
        ).hexdigest()
        cache = CACHE_DIR / "tts" / f"{key}.npy"
        if cache.exists():
            return np.load(cache)
        cfg = SynthesisConfig(
            length_scale=length_scale,
            noise_scale=noise_scale,
            noise_w_scale=noise_w,
            normalize_audio=False,
        )
        chunks = [c.audio_float_array for c in self.voice(voice_name).synthesize(spoken, cfg)]
        audio = np.concatenate(chunks) if chunks else np.zeros(1, dtype=np.float32)
        audio = trim(audio.astype(np.float32))
        cache.parent.mkdir(parents=True, exist_ok=True)
        np.save(cache, audio)
        return audio


def prepare_text(text: str) -> str:
    """Text as the TTS should read it (captions keep the original)."""
    t = text.replace("…", ".").replace("...", ".")
    t = t.replace("«", "").replace("»", "").replace("“", "").replace("”", "").replace('"', "")
    t = t.replace(" — ", ", ").replace("—", ", ").replace(" – ", ", ")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def trim(audio: np.ndarray, threshold_db: float = -48.0, pad: float = 0.04) -> np.ndarray:
    if audio.size == 0:
        return audio
    frame = int(0.01 * SR)
    n = len(audio) // frame
    if n == 0:
        return audio
    rms = np.sqrt(np.mean(audio[: n * frame].reshape(n, frame) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    active = np.where(db > threshold_db)[0]
    if active.size == 0:
        return audio
    start = max(0, active[0] * frame - int(pad * SR))
    end = min(len(audio), (active[-1] + 1) * frame + int(pad * SR))
    return audio[start:end]


# --------------------------------------------------------------------------- dsp


def active_rms(audio: np.ndarray) -> float:
    frame = int(0.02 * SR)
    n = len(audio) // frame
    if n == 0:
        return float(np.sqrt(np.mean(audio**2) + 1e-12))
    frames = audio[: n * frame].reshape(n, frame)
    rms = np.sqrt(np.mean(frames**2, axis=1) + 1e-12)
    loud = rms[rms > np.max(rms) * 0.12]
    return float(np.sqrt(np.mean(loud**2))) if loud.size else float(np.max(rms))


def level(audio: np.ndarray, target_db: float = -21.0) -> np.ndarray:
    gain = 10 ** (target_db / 20) / max(active_rms(audio), 1e-6)
    return audio * gain


def fade(audio: np.ndarray, fade_in: float = 0.012, fade_out: float = 0.03) -> np.ndarray:
    a = audio.copy()
    i = min(len(a), int(fade_in * SR))
    o = min(len(a), int(fade_out * SR))
    if i:
        a[:i] *= np.linspace(0, 1, i) ** 2
    if o:
        a[-o:] *= np.linspace(1, 0, o) ** 2
    return a


def room_ir(seconds: float, seed: int, damp: float = 0.35) -> np.ndarray:
    """Small synthetic room: a few early reflections plus a darkening noise tail."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    tail = rng.standard_normal(n) * np.exp(-6.9 * t / seconds)
    # progressively darker tail (air absorption)
    out = np.zeros(n)
    y = 0.0
    for idx in range(n):
        coef = damp + (0.93 - damp) * (idx / n)
        y = coef * y + (1 - coef) * tail[idx]
        out[idx] = y
    ir = out
    for delay, gain in ((0.007, 0.5), (0.013, -0.35), (0.021, 0.28), (0.029, -0.2), (0.041, 0.14)):
        k = int(delay * SR)
        if k < n:
            ir[k] += gain * 3.0
    ir /= np.sqrt(np.sum(ir**2))
    return ir.astype(np.float32)


_VOICE_IR = None
_BELL_IR = None


def voice_space(voice: np.ndarray) -> np.ndarray:
    global _VOICE_IR
    if _VOICE_IR is None:
        _VOICE_IR = room_ir(0.7, seed=7)
    hp = butter(2, 75, btype="highpass", fs=SR, output="sos")
    dry = sosfilt(hp, voice)
    # soften the top end a touch (synthetic voices can be a little sizzly)
    lp = butter(2, 8200, btype="lowpass", fs=SR, output="sos")
    dry = 0.8 * dry + 0.2 * sosfilt(lp, dry)
    wet = fftconvolve(dry, _VOICE_IR)[: len(dry)]
    return (dry + wet * 0.14).astype(np.float32)


def bell(f0: float, peak_db: float, seconds: float = 11.0, seed: int = 1) -> np.ndarray:
    """Singing bowl strike: inharmonic partials, slow beating, mallet transient."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    partials = [
        (1.0, 1.0, 7.5),
        (2.72, 0.46, 5.0),
        (5.18, 0.2, 3.0),
        (8.35, 0.09, 1.8),
        (12.1, 0.04, 1.0),
    ]
    out = np.zeros(n)
    for ratio, amp, decay in partials:
        f = f0 * ratio
        if f > SR / 2 - 500:
            continue
        beat = rng.uniform(0.35, 1.4)
        phase = rng.uniform(0, 2 * np.pi)
        env = np.exp(-t / (decay / 2.2))
        out += amp * env * (
            np.sin(2 * np.pi * (f - beat / 2) * t + phase) + np.sin(2 * np.pi * (f + beat / 2) * t)
        ) * 0.5
    attack = np.minimum(1.0, t / 0.004)
    out *= attack
    # mallet "tock"
    tock_len = int(0.03 * SR)
    tock = rng.standard_normal(tock_len) * np.exp(-np.arange(tock_len) / (0.004 * SR))
    bp = butter(2, [900, 3200], btype="bandpass", fs=SR, output="sos")
    out[:tock_len] += sosfilt(bp, tock) * 0.08
    global _BELL_IR
    if _BELL_IR is None:
        _BELL_IR = room_ir(3.2, seed=11, damp=0.5)
    wet = fftconvolve(out, _BELL_IR)[:n]
    out = out + wet * 0.35
    out *= np.minimum(1.0, (n - np.arange(n)) / (1.2 * SR))  # tail fade
    out = out / np.max(np.abs(out)) * 10 ** (peak_db / 20)
    return out.astype(np.float32)


# --------------------------------------------------------------------------- assembly


def render(script: Script, synth: Synth) -> tuple[np.ndarray, dict]:
    has_start = "start" in script.bells
    has_end = "end" in script.bells
    intro = 4.2 if has_start else 1.2
    outro_gap = 2.6 if has_end else 0.0
    outro_tail = 9.5 if has_end else 4.0

    clips: dict[int, np.ndarray] = {}
    for i, ev in enumerate(script.events):
        if isinstance(ev, Speech):
            clips[i] = fade(level(synth.say(script.voice, ev.text, script.pace)))

    fixed = intro + outro_gap + outro_tail
    weights = 0.0
    for i, ev in enumerate(script.events):
        if isinstance(ev, Speech):
            fixed += len(clips[i]) / SR + ev.gap
        elif isinstance(ev, Pause):
            if ev.weight:
                weights += ev.weight
            else:
                fixed += ev.seconds
        elif isinstance(ev, Bell):
            fixed += 7.0

    flex_unit = 0.0
    warnings = []
    if weights:
        if script.target:
            available = script.target - fixed
            flex_unit = available / weights
            if flex_unit * min(
                e.weight for e in script.events if isinstance(e, Pause) and e.weight
            ) < MIN_FLEX:
                warnings.append(
                    f"target {script.target:.0f}s too short (fixed {fixed:.0f}s); using minimum pauses"
                )
                flex_unit = MIN_FLEX / min(
                    e.weight for e in script.events if isinstance(e, Pause) and e.weight
                )
        else:
            flex_unit = 8.0
    elif script.target and abs(script.target - fixed) > 20:
        warnings.append(f"no flexible pauses; natural length {fixed:.0f}s vs target {script.target:.0f}s")

    total = fixed + flex_unit * weights
    n = int(np.ceil(total * SR)) + SR
    voice_track = np.zeros(n, dtype=np.float32)
    bell_track = np.zeros(n, dtype=np.float32)

    captions = []
    cues = []
    t = intro
    if has_start:
        b = bell(196.0, -20.0, seed=3)
        bell_track[int(0.4 * SR) : int(0.4 * SR) + len(b)] += b[: n - int(0.4 * SR)]
        cues.append({"t": 0.4, "type": "bell"})

    for i, ev in enumerate(script.events):
        if isinstance(ev, Speech):
            clip = clips[i]
            s = int(t * SR)
            voice_track[s : s + len(clip)] += clip
            dur = len(clip) / SR
            captions.append({"s": round(t, 2), "e": round(t + dur, 2), "t": ev.text})
            t += dur + ev.gap
        elif isinstance(ev, Pause):
            t += ev.weight * flex_unit if ev.weight else ev.seconds
        elif isinstance(ev, Bell):
            b = bell(233.1, -19.0, seed=5)
            s = int((t + 0.3) * SR)
            bell_track[s : s + len(b)] += b[: max(0, n - s)]
            cues.append({"t": round(t + 0.3, 2), "type": "bell"})
            t += 7.0

    if has_end:
        t += outro_gap
        b = bell(174.6, -13.0, seconds=11.5, seed=9)
        s = int(t * SR)
        bell_track[s : s + len(b)] += b[: max(0, n - s)]
        cues.append({"t": round(t, 2), "type": "bell"})
    t += outro_tail

    total_samples = int(t * SR)
    voice_track = voice_space(voice_track)[:total_samples]
    mix = voice_track + bell_track[:total_samples]
    peak = np.max(np.abs(mix))
    if peak > 0.89:
        mix *= 0.89 / peak
    fo = int(2.5 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo) ** 1.5
    meta = {
        "duration": round(total_samples / SR, 2),
        "captions": captions,
        "cues": cues,
        "warnings": warnings,
    }
    return mix, meta


def encode_mp3(audio: np.ndarray, out: Path, ffmpeg: str) -> None:
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        with wave.open(tmp.name, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        cmd = [
            ffmpeg, "-y", "-loglevel", "error", "-i", tmp.name,
            "-c:a", "libmp3lame", "-q:a", "7", "-ar", str(SR), "-ac", "1",
            "-id3v2_version", "3", "-metadata", "artist=CalmabyEli",
            str(out),
        ]
        subprocess.run(cmd, check=True)
    Path(tmp.name).unlink(missing_ok=True)


def find_ffmpeg() -> str:
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:  # noqa: BLE001
        return "ffmpeg"


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--force", action="store_true")
    ap.add_argument(
        "--models-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "models",
        help="folder with vits-piper-* voice folders (see setup.sh)",
    )
    args = ap.parse_args()

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    CAPTIONS_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}

    paths = sorted(SCRIPTS_DIR.glob("*.txt"))
    if args.ids:
        paths = [p for p in paths if p.stem in set(args.ids)]
    synth = Synth(args.models_dir)
    ffmpeg = find_ffmpeg()

    for path in paths:
        source_hash = hashlib.sha1(
            (PIPELINE_VERSION + "|" + path.read_text(encoding="utf-8")).encode()
        ).hexdigest()[:10]
        out = AUDIO_DIR / f"{path.stem}.mp3"
        if (
            not args.force
            and out.exists()
            and manifest.get(path.stem, {}).get("v") == source_hash
        ):
            continue
        script = parse_script(path)
        audio, meta = render(script, synth)
        encode_mp3(audio, out, ffmpeg)
        caption_doc = {
            "id": script.id,
            "duration": meta["duration"],
            "voice": script.voice,
            "captions": meta["captions"],
            "cues": meta["cues"],
        }
        (CAPTIONS_DIR / f"{path.stem}.json").write_text(
            json.dumps(caption_doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
        )
        manifest[path.stem] = {
            "duration": meta["duration"],
            "voice": script.voice,
            "bytes": out.stat().st_size,
            "v": source_hash,
        }
        kb = out.stat().st_size / 1024
        warn = f"  ⚠ {'; '.join(meta['warnings'])}" if meta["warnings"] else ""
        print(f"✓ {path.stem:32s} {meta['duration']/60:5.1f} min  {kb:7.0f} KB{warn}", flush=True)
        MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + "\n")

    # drop entries whose script no longer exists
    existing = {p.stem for p in SCRIPTS_DIR.glob("*.txt")}
    for key in list(manifest):
        if key not in existing:
            del manifest[key]
    MANIFEST.write_text(json.dumps(dict(sorted(manifest.items())), indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    sys.exit(main())
