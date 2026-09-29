#!/usr/bin/env python3
"""
Render narration for the Activation Station episodes with the built-in macOS voice.

  python3 scripts/lab/narrate.py [--voice Daniel] [--rate 182] [--dry]

Reads every subtitle from the running dev server (/lab/narration/captions), turns the HTML and
math into speakable English, renders one clip per subtitle with `say`, converts it to AAC with
`afconvert`, and writes public/lab/narration/manifest.json with each clip's start and duration.
The player uses the durations to hold the picture whenever the narrator needs more time.
"""
import argparse
import html
import json
import os
import re
import subprocess
import tempfile
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'lab', 'narration')

# exact phrases first (longest first), then symbols
PHRASES = [
    ('Qwen2.5-7B-Instruct', 'Qwen 2.5, 7B Instruct'),
    ('Llama-3.1-8B-Instruct', 'Llama 3.1, 8B Instruct'),
    ('Llama-3.1-8B', 'Llama 3.1, 8B'),
    ('Gemma-2-9B-it', 'Gemma 2, 9B'),
    ('Gemma-2-9B', 'Gemma 2, 9B'),
    ('Gemma-2-2B', 'Gemma 2, 2B'),
    ('Gemma-2', 'Gemma 2'),
    ('Qwen3-8B', 'Qwen 3, 8B'),
    ('SALADBench', 'Salad Bench'),
    ('ConfAIde', 'Confide'),
    ('FINRA 2111', 'FINRA rule twenty-one eleven'),
    ('Activation Station', 'Activation Station'),
    ('α*(f)', 'alpha star of f'),
    ('α*', 'alpha star'),
    ('α·', 'alpha times '),
    ("h′", 'h prime'),
    ('W dec', 'W dec'),
    ('16,384', 'sixteen thousand three hundred and eighty four'),
    ('16K', '16 K'),
    ('65K', '65 K'),
    ('AUC', 'A U C'),
    ('SAEs', 'S A Es'),
    ('SAE', 'S A E'),
    ('evidence-span', 'evidence span'),
    ('in-fold', 'in fold'),
    ('layer-11', 'layer 11'),
    ('layer-20', 'layer 20'),
    ('one-field', 'one field'),
    ('e.g.', 'for example'),
]


def speakable(h: str) -> str:
    s = h
    s = re.sub(r'<sup>([^<]+)</sup>', lambda m: ' to the ' + m.group(1), s)
    s = re.sub(r'<sub>([^<]+)</sub>', lambda m: ' ' + m.group(1), s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s)
    for a, b in PHRASES:
        s = s.replace(a, b)
    s = s.replace('α', 'alpha').replace('ρ', 'rho').replace('Δ', 'delta')
    s = re.sub(r'cos\(v f, v g\)', 'the cosine between v f and v g', s)
    s = s.replace('≥', ' at least ').replace('≤', ' at most ')
    s = re.sub(r'×\s*(\d)', r'times \1', s)
    s = s.replace('×', ' by ')
    s = s.replace('·', ' times ')
    s = s.replace('−', 'minus ')
    s = re.sub(r'\s=\s', ' equals ', s)
    s = re.sub(r'\s<\s', ' less than ', s)
    s = re.sub(r'\s\+\s', ' plus ', s)
    s = re.sub(r'(?<![\w.])\+(\d)', r'plus \1', s)
    s = re.sub(r'(?<![\d])\.(\d)', r'0.\1', s)  # .006 -> 0.006
    s = s.replace('“', '').replace('”', '').replace('‘', "'").replace('’', "'")
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def duration(path: str) -> float:
    out = subprocess.run(['afinfo', path], capture_output=True, text=True).stdout
    m = re.search(r'estimated duration:\s*([\d.]+)', out)
    return float(m.group(1)) if m else 0.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='Daniel')
    ap.add_argument('--rate', type=int, default=182)
    ap.add_argument('--url', default='http://localhost:3007/lab/narration/captions')
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    data = json.load(urllib.request.urlopen(a.url))
    manifest = {'voice': a.voice, 'episodes': {}}
    for ep, info in data.items():
        os.makedirs(os.path.join(OUT, ep), exist_ok=True)
        clips = []
        for i, line in enumerate(info['lines']):
            text = speakable(line['html'])
            if a.dry:
                print(f'{ep}:{i:02d}  {text}')
                continue
            rel = f'{ep}/{i:02d}.m4a'
            dst = os.path.join(OUT, rel)
            with tempfile.TemporaryDirectory() as tmp:
                aiff = os.path.join(tmp, 'x.aiff')
                subprocess.run(['say', '-v', a.voice, '-r', str(a.rate), '-o', aiff, text], check=True)
                subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', aiff, dst], check=True)
            clips.append({'start': line['start'], 'dur': round(duration(dst), 3), 'src': f'/lab/narration/{rel}', 'text': text})
            print(f'{ep}:{i:02d}  {clips[-1]["dur"]:5.2f}s  {text[:90]}')
        manifest['episodes'][ep] = {'duration': info['duration'], 'clips': clips}
    if not a.dry:
        with open(os.path.join(OUT, 'manifest.json'), 'w') as f:
            json.dump(manifest, f, indent=1, ensure_ascii=False)
        print('wrote', os.path.join(OUT, 'manifest.json'))


if __name__ == '__main__':
    main()
