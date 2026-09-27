"""Dora synthesis and phrase captions, reusing the existing session assembler."""
import hashlib
import os
import re
import tempfile
from pathlib import Path

import numpy as np
import render as r

VERSION = 'dora-batches-v1-082'
r.SR = 24000
r.PARAGRAPH_GAP = 3.0


def phrases(paragraph):
    parts = r.INLINE_PAUSE_RE.split(re.sub(r'\s+', ' ', paragraph).strip())
    result = []
    for i in range(0, len(parts), 2):
        group = []
        for sentence, _ in r._split_plain(parts[i]):
            words = sentence.split()
            for k in range(0, len(words), 35):
                piece = ' '.join(words[k:k + 35])
                if group and len((' '.join(group) + ' ' + piece).split()) > 35:
                    result.append((' '.join(group), r.SENTENCE_GAP))
                    group = []
                group.append(piece)
        if group:
            gap = float(parts[i + 1]) if i + 1 < len(parts) else r.PARAGRAPH_GAP
            result.append((' '.join(group), gap))
    return result


r.split_sentences = phrases
r.voice_space = lambda audio: audio
original_bell = r.bell


def soft_bell(f0, peak_db, **kwargs):
    return original_bell(f0, min(peak_db, -23.0), **kwargs)


r.bell = soft_bell


class Synth:
    def __init__(self, models):
        from kokoro_onnx import Kokoro
        import onnxruntime as ort
        config = ort.SessionOptions()
        config.intra_op_num_threads = 2
        config.inter_op_num_threads = 1
        session = ort.InferenceSession(str(models / 'kokoro-v1.0.onnx'),
                                       sess_options=config, providers=['CPUExecutionProvider'])
        self.model = Kokoro.from_session(session, str(models / 'voices-v1.0.bin'))

    def say(self, voice, text, pace):
        assert voice == 'luz', 'Only the approved female Dora voice is supported'
        speed = .82 * min(1.0, 1.14 / pace) if pace else .82
        spoken = r.prepare_text(text)
        key = hashlib.sha256(f'{VERSION}|{speed}|{spoken}'.encode()).hexdigest()
        cache = r.CACHE_DIR / 'dora' / f'{key}.npy'
        if cache.exists():
            return np.load(cache, allow_pickle=False)
        samples, rate = self.model.create(spoken, voice='ef_dora', speed=speed, lang='es')
        assert rate == r.SR and len(samples) and np.isfinite(samples).all()
        samples = r.trim(np.asarray(samples, dtype=np.float32))
        cache.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(dir=cache.parent, delete=False) as temporary:
            np.save(temporary, samples)
        os.replace(temporary.name, cache)
        return samples


def version(path):
    return hashlib.sha256((VERSION + '|' + path.read_text()).encode()).hexdigest()[:12]
