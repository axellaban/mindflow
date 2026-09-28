#!/usr/bin/env python3
"""
Narration with OpenAI's gpt-4o-mini-tts, voice "marin", checked sentence by sentence.

Uses render.py's assembly (pauses, bells, captions, levels) but every sentence is spoken
by the OpenAI voice and then transcribed: if what is heard does not match the text, or
the clip is implausibly long or short, the sentence is generated again and the best take
is kept. Writes to the same places as render.py (public/audio, public/captions, the
manifest) and records what was verified in tools/tts/openai-progress.json.

    OPENAI_API_KEY=... python tools/tts/openai_voice.py aam-1-respiracion
    OPENAI_API_KEY=... python tools/tts/openai_voice.py --all --publish

--publish commits and pushes every few sessions, so a long run never loses its work.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import subprocess
import sys
import time
import unicodedata
import urllib.error
import urllib.request
import uuid
import wave
from concurrent.futures import ThreadPoolExecutor
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np

import render as r

r.SR = 24000  # the API returns 24 kHz PCM
r.PARAGRAPH_GAP = 3.0
r.voice_space = lambda audio: audio  # the voice stays dry
_bell = r.bell
r.bell = lambda f0, peak_db, **kw: _bell(f0, min(peak_db, -23.0), **kw)

API = "https://api.openai.com/v1"
MODEL = "gpt-4o-mini-tts-2025-12-15"
VOICE = "marin"
INSTRUCTIONS = (
    "Voice: a warm, gentle female meditation guide speaking Spanish.\n"
    "Accent: neutral Latin American Spanish, with seseo; never the Castilian 'th' sound.\n"
    "Pace: slow and unhurried, with soft natural pauses at commas.\n"
    "Tone: calm, intimate and reassuring, as if guiding one person in a quiet room.\n"
    "Avoid: sounding dramatic, cheerful, salesy or like a radio announcer."
)
# scripts that set a slower pace are for falling asleep
SLEEPY = "\nThis is for falling asleep: even slower and softer, drowsy and soothing."
VERSION = hashlib.sha1(f"openai-2|{MODEL}|{VOICE}|{INSTRUCTIONS}|{SLEEPY}|{r.PARAGRAPH_GAP}".encode()).hexdigest()

TAKES = 3  # attempts per sentence
WORKERS = 6
PROGRESS = Path(__file__).resolve().parent / "openai-progress.json"
CLIP_CACHE = r.CACHE_DIR / "openai"


# --------------------------------------------------------------------------- API


def _call(path: str, body: bytes, content_type: str) -> bytes:
    for attempt in range(6):
        request = urllib.request.Request(
            f"{API}/{path}",
            data=body,
            headers={"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": content_type},
        )
        try:
            with urllib.request.urlopen(request, timeout=180) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            detail = error.read().decode(errors="replace")
            # no credit left is also a 429, but waiting does not fix it
            if error.code not in (408, 409, 429, 500, 502, 503, 504) or "insufficient_quota" in detail or attempt == 5:
                raise SystemExit(f"OpenAI {path} {error.code}: {detail[:400]}")
            wait = float(error.headers.get("Retry-After") or 2**attempt)
        except (urllib.error.URLError, TimeoutError) as error:
            if attempt == 5:
                raise SystemExit(f"OpenAI {path}: {error}")
            wait = 2**attempt
        time.sleep(min(wait, 60))
    raise AssertionError("unreachable")


def spoken_input(text: str) -> str:
    """The text as the voice gets it. The voice sometimes stops at a colon, so it gets a comma
    (or a full stop at the end); the captions keep the colon."""
    return re.sub(r":\s*$", ".", r.prepare_text(text)).replace(":", ",")


def speak(text: str, sleepy: bool) -> np.ndarray:
    body = json.dumps({
        "model": MODEL,
        "voice": VOICE,
        "input": spoken_input(text),
        "instructions": INSTRUCTIONS + (SLEEPY if sleepy else ""),
        "response_format": "pcm",
    }).encode()
    pcm = _call("audio/speech", body, "application/json")
    return r.trim(np.frombuffer(pcm, dtype="<i2").astype(np.float32) / 32768)


def hear(audio: np.ndarray) -> str:
    wav = io.BytesIO()
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(r.SR)
        w.writeframes((np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes())
    boundary = uuid.uuid4().hex
    fields = {"model": "whisper-1", "language": "es", "response_format": "json"}
    body = b"".join(
        f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items()
    )
    body += (
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="clip.wav"\r\n'
        "Content-Type: audio/wav\r\n\r\n"
    ).encode() + wav.getvalue() + f"\r\n--{boundary}--\r\n".encode()
    return json.loads(_call("audio/transcriptions", body, f"multipart/form-data; boundary={boundary}"))["text"]


# --------------------------------------------------------------------------- checks


def words(text: str) -> list[str]:
    plain = "".join(c for c in unicodedata.normalize("NFD", text.lower()) if unicodedata.category(c) != "Mn")
    return re.findall(r"[a-z0-9]+", plain)


NUMBERS = set(
    "cero un una uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis "
    "diecisiete dieciocho diecinueve veinte veintiuno veintidos veintitres veinticuatro veinticinco veintiseis "
    "veintisiete veintiocho veintinueve treinta cuarenta cincuenta sesenta setenta ochenta noventa cien ciento mil".split()
)


def content(text: str) -> list[str]:
    """The words that must be heard. Numbers are left out: transcriptions write them as digits."""
    return [w for w in words(text) if w not in NUMBERS and not w.isdigit()]


def check(expected: str, heard: str, seconds: float) -> tuple[float, bool]:
    """How closely the take matches the text (0 to 1), and whether it passes. A take fails when
    its length is implausible or words are missing: two or more in a row, or the last ones."""
    n = len(words(expected))
    if n >= 5 and not 0.7 <= n / max(seconds, 0.01) <= 4.5:
        return 0.0, False
    want, got = content(expected), content(heard)
    if not want:  # a count: "dos", "Diez…"
        return 1.0, True
    value = round(SequenceMatcher(None, " ".join(want), " ".join(got)).ratio(), 3)
    for op, i1, i2, j1, j2 in SequenceMatcher(None, want, got, autojunk=False).get_opcodes():
        missing = (i2 - i1) - (j2 - j1) if op in ("delete", "replace") else 0
        if missing >= 2 or (op == "delete" and i2 == len(want)):
            return value, False
    return value, value >= (0.85 if len(want) >= 4 else 0.6)


class VerifiedSynth:
    """Speaks every sentence up front, keeping the take that best matches its text."""

    def __init__(self) -> None:
        self.clips: dict[str, np.ndarray] = {}
        self.report: dict[str, dict] = {}

    def _take(self, text: str, sleepy: bool) -> tuple[np.ndarray, dict]:
        key = hashlib.sha1(f"{VERSION}|{sleepy}|{text}".encode()).hexdigest()
        cache = CLIP_CACHE / f"{key}.npz"
        if cache.exists():
            with np.load(cache, allow_pickle=False) as data:
                return data["audio"], json.loads(str(data["report"]))
        best, report = None, {"ok": False, "score": -1.0, "heard": "", "takes": 0}
        for take in range(1, TAKES + 1):
            audio = speak(text, sleepy)
            heard = hear(audio)
            value, ok = check(text, heard, len(audio) / r.SR)
            if (ok, value) > (report["ok"], report["score"]):
                best, report = audio, {"ok": ok, "score": value, "heard": heard, "takes": take}
            report["takes"] = take
            if ok:
                break
        CLIP_CACHE.mkdir(parents=True, exist_ok=True)
        tmp = cache.with_suffix(".tmp.npz")
        np.savez(tmp, audio=best, report=json.dumps(report, ensure_ascii=False))
        os.replace(tmp, cache)
        return best, report

    def prepare(self, texts: list[str], sleepy: bool) -> None:
        # one session at a time in memory; a sentence repeated in another session comes from the cache
        self.clips, self.report = {}, {}
        todo = list(dict.fromkeys(texts))
        with ThreadPoolExecutor(WORKERS) as pool:
            for text, (audio, report) in zip(todo, pool.map(lambda t: self._take(t, sleepy), todo)):
                self.clips[text], self.report[text] = audio, report

    def say(self, _voice: str, text: str, _pace: float | None) -> np.ndarray:
        return self.clips[text]


# --------------------------------------------------------------------------- sessions


def version(path: Path) -> str:
    return hashlib.sha1(f"{VERSION}|{path.read_text(encoding='utf-8')}".encode()).hexdigest()[:10]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def decoded_seconds(path: Path, ffmpeg: str) -> float:
    raw = subprocess.run(
        [ffmpeg, "-v", "error", "-xerror", "-i", str(path), "-f", "s16le", "-ac", "1", "-ar", str(r.SR), "-"],
        check=True, capture_output=True,
    ).stdout
    return len(raw) / 2 / r.SR


def narrate(path: Path, synth: VerifiedSynth, ffmpeg: str) -> tuple[dict, dict]:
    script = r.parse_script(path)
    spoken = [e.text for e in script.events if isinstance(e, r.Speech)]
    synth.prepare(spoken, sleepy=bool(script.pace and script.pace > 1.15))
    audio, meta = r.render(script, synth)

    out = r.AUDIO_DIR / f"{path.stem}.mp3"
    staged = out.with_suffix(".staging.mp3")
    r.encode_mp3(audio, staged, ffmpeg)
    os.replace(staged, out)
    doc = {"id": script.id, "duration": meta["duration"], "voice": script.voice, "captions": meta["captions"], "cues": meta["cues"]}
    (r.CAPTIONS_DIR / f"{path.stem}.json").write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    # the file decodes whole, lasts what was rendered, and its captions are the script's sentences in order
    assert abs(decoded_seconds(out, ffmpeg) - meta["duration"]) < 0.15, path.stem
    caps = meta["captions"]
    assert [c["t"] for c in caps] == spoken, path.stem
    assert all(0 <= c["s"] < c["e"] <= meta["duration"] for c in caps), path.stem
    assert all(a["e"] <= b["s"] for a, b in zip(caps, caps[1:])), path.stem

    reports = [synth.report[t] for t in spoken]
    heard = {t: {"text": t, "heard": synth.report[t]["heard"], "score": synth.report[t]["score"]} for t in dict.fromkeys(spoken)}
    flagged = [heard[t] for t in heard if not synth.report[t]["ok"]]
    # the closest calls, to read over even when they passed
    lowest = sorted((heard[t] for t in heard if synth.report[t]["ok"] and heard[t]["score"] < 1), key=lambda h: h["score"])[:3]
    entry = {"duration": meta["duration"], "voice": script.voice, "bytes": out.stat().st_size, "v": version(path)}
    record = {
        "v": entry["v"],
        "audio_sha256": digest(out),
        "sentences": len(spoken),
        "retaken": sum(rep["takes"] > 1 for rep in reports),
        "lowest_score": min(rep["score"] for rep in reports),
        "flagged": flagged,
        "lowest": lowest,
    }
    return entry, record


def write_json(path: Path, data: dict) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=r.ROOT, check=True, capture_output=True, text=True).stdout.strip()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--publish", action="store_true", help="commit and push every --batch sessions")
    ap.add_argument("--batch", type=int, default=10)
    args = ap.parse_args()
    if not os.environ.get("OPENAI_API_KEY"):
        sys.exit("Missing OPENAI_API_KEY")
    if args.publish and git("status", "--porcelain"):
        sys.exit("Start from a clean checkout")

    manifest = json.loads(r.MANIFEST.read_text())
    progress = json.loads(PROGRESS.read_text()) if PROGRESS.exists() else {"sessions": {}}
    paths = sorted(r.SCRIPTS_DIR.glob("*.txt"))
    chosen = paths if args.all else [p for p in paths if p.stem in set(args.ids)]
    if not args.all and len(chosen) != len(set(args.ids)):
        sys.exit(f"Unknown ids: {sorted(set(args.ids) - {p.stem for p in chosen})}")

    def done(p: Path) -> bool:
        record = progress["sessions"].get(p.stem, {})
        audio = r.AUDIO_DIR / f"{p.stem}.mp3"
        return (record.get("v") == version(p) == manifest.get(p.stem, {}).get("v")
                and audio.exists() and record.get("audio_sha256") == digest(audio))

    pending = [p for p in chosen if not done(p)]
    print(f"{len(pending)} to narrate, {len(chosen) - len(pending)} already verified", flush=True)
    synth, ffmpeg = VerifiedSynth(), r.find_ffmpeg()
    changed: list[Path] = []

    def save() -> None:
        nonlocal changed
        files, changed = [*changed, r.MANIFEST, PROGRESS], []
        progress["verified"] = sum(done(p) for p in paths)
        progress["total"] = len(paths)
        write_json(r.MANIFEST, dict(sorted(manifest.items())))
        write_json(PROGRESS, progress)
        if args.publish:
            git("add", "--", *[str(p.relative_to(r.ROOT)) for p in files])
            git("commit", "-m", f"Voz de OpenAI: {progress['verified']} de {len(paths)} sesiones narradas y verificadas")
            git("push", "origin", "HEAD")  # a concurrent push is rejected; never forced
            print(f"saved {git('rev-parse', '--short', 'HEAD')}", flush=True)

    try:
        for i, path in enumerate(pending, start=1):
            started = time.time()
            manifest[path.stem], progress["sessions"][path.stem] = narrate(path, synth, ffmpeg)
            rec = progress["sessions"][path.stem]
            print(f"✓ {path.stem:30s} {manifest[path.stem]['duration'] / 60:5.1f} min  {rec['sentences']} sentences, "
                  f"{rec['retaken']} retaken, {len(rec['flagged'])} flagged  ({time.time() - started:.0f} s)", flush=True)
            changed += [r.AUDIO_DIR / f"{path.stem}.mp3", r.CAPTIONS_DIR / f"{path.stem}.json"]
            if i % args.batch == 0:
                save()
    finally:
        # also when something fails: keep every session that was already verified
        if changed:
            save()


if __name__ == "__main__":
    main()
