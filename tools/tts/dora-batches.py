"""Render, verify, commit and push three sessions before starting the next batch."""
import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path

import dora
from dora import r

BRANCH = 'codex/dora-batches'
PROGRESS = Path(__file__).with_name('dora-progress.json')


def run(*args):
    return subprocess.check_output(args, cwd=r.ROOT, text=True).strip()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path, data):
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    os.replace(temporary, path)


def publish(paths, message):
    run('git', 'add', '--', *[str(p.relative_to(r.ROOT)) for p in paths])
    run('git', 'commit', '-m', message)
    # A concurrent edit rejects the push. Never force or discard somebody else's work.
    run('git', 'push', 'origin', f'HEAD:refs/heads/{BRANCH}')
    print(f'SAVED {run("git", "rev-parse", "HEAD")} {message}', flush=True)


def validate(path, entry):
    audio = r.AUDIO_DIR / f'{path.stem}.mp3'
    caption_path = r.CAPTIONS_DIR / f'{path.stem}.json'
    captions = json.loads(caption_path.read_text())
    script = r.parse_script(path)
    spoken = [e for e in script.events if isinstance(e, r.Speech)]
    assert audio.stat().st_size == entry['bytes']
    duration = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(audio)))
    assert abs(duration - entry['duration']) < .15, path.stem
    subprocess.run(['ffmpeg', '-v', 'error', '-xerror', '-i', str(audio), '-f', 'null', '-'], check=True)
    assert [c['t'] for c in captions['captions']] == [e.text for e in spoken]
    assert all(0 <= c['s'] < c['e'] <= entry['duration'] for c in captions['captions'])
    assert all(a['e'] <= b['s'] for a, b in zip(captions['captions'], captions['captions'][1:]))
    assert all(len(c['t'].split()) <= 35 for c in captions['captions'])
    body = path.read_text().split('---', 2)[2]
    original = ' '.join(line.strip() for line in body.splitlines() if line.strip() and not line.strip().startswith(('#', '[')))
    original = re.sub(r'\{[\d.]+\}', ' ', original)
    assert original.split() == ' '.join(e.text for e in spoken).split(), path.stem
    if not script.bells:
        assert not captions['cues'], path.stem
    return {'audio_sha256': digest(audio), 'captions_sha256': digest(caption_path), 'version': entry['v']}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--publish', action='store_true')
    ap.add_argument('--limit', type=int, default=0)
    args = ap.parse_args()
    if args.publish:
        assert os.environ.get('GITHUB_REPOSITORY') == 'axellaban/mindflow'
        assert run('git', 'branch', '--show-current') == BRANCH
        assert not run('git', 'status', '--porcelain'), 'Start from a clean checkout'
    manifest = json.loads(r.MANIFEST.read_text())
    progress = json.loads(PROGRESS.read_text()) if PROGRESS.exists() else {'validated': {}}
    paths = sorted(r.SCRIPTS_DIR.glob('*.txt'))
    pending = []
    for path in paths:
        record = progress['validated'].get(path.stem, {})
        entry = manifest.get(path.stem, {})
        audio = r.AUDIO_DIR / f'{path.stem}.mp3'
        captions = r.CAPTIONS_DIR / f'{path.stem}.json'
        valid = (record.get('version') == dora.version(path) == entry.get('v')
                 and audio.exists() and captions.exists()
                 and record.get('audio_sha256') == digest(audio)
                 and record.get('captions_sha256') == digest(captions))
        if not valid:
            progress['validated'].pop(path.stem, None)
            pending.append(path)
    if args.limit:
        pending = pending[:args.limit]
    synth = dora.Synth(Path(__file__).with_name('models')) if pending else None
    for offset in range(0, len(pending), 3):
        changed = [r.MANIFEST, PROGRESS]
        for path in pending[offset:offset + 3]:
            print(f'RENDER {path.stem}', flush=True)
            script = r.parse_script(path)
            samples, meta = r.render(script, synth)
            audio = r.AUDIO_DIR / f'{path.stem}.mp3'
            staged = audio.with_suffix('.staging.mp3')
            r.encode_mp3(samples, staged, 'ffmpeg')
            os.replace(staged, audio)
            caption_path = r.CAPTIONS_DIR / f'{path.stem}.json'
            write_json(caption_path, {'id': path.stem, 'voice': script.voice,
                       'duration': meta['duration'], 'captions': meta['captions'], 'cues': meta['cues']})
            entry = {'duration': meta['duration'], 'voice': script.voice, 'bytes': audio.stat().st_size,
                     'v': dora.version(path), 'engine': 'kokoro-82m', 'preset': 'ef_dora'}
            progress['validated'][path.stem] = validate(path, entry)
            manifest[path.stem] = entry
            changed.extend([audio, caption_path])
            print(f'VALIDATED {path.stem}: {meta["duration"]}s', flush=True)
        progress['completed'] = len(progress['validated'])
        progress['total'] = len(paths)
        progress['audio_complete'] = all(p.stem in progress['validated'] for p in paths)
        write_json(r.MANIFEST, dict(sorted(manifest.items())))
        write_json(PROGRESS, progress)
        if args.publish:
            publish(changed, f'Dora audio batch: {progress["completed"]}/{len(paths)} sessions verified')
    if all(p.stem in progress['validated'] for p in paths):
        catalog = r.ROOT / 'src/content/catalog.ts'
        original = catalog.read_text()
        updated = original.replace("name: 'Luz', note: 'voz neural'", "name: 'Dora', note: 'voz sintética'")
        if updated != original:
            catalog.write_text(updated)
            if args.publish:
                publish([catalog], 'Label the completed synthetic Dora narration catalog')
        print(f'ALL {len(paths)} AUDIO FILES VERIFIED AND SAVED', flush=True)


if __name__ == '__main__':
    main()
