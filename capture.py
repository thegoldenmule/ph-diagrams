#!/usr/bin/env python3
"""capture.py — Capture theme/background variants of diagram pages with headless Chrome.

    python3 capture.py <page-id>... [--all] --variant light [--variant transparent ...]

Variants and their output names:
    dark               -> {id}.png
    light              -> {id}-light.png
    transparent        -> {id}-transparent.png        (dark ink, no background)
    light-transparent  -> {id}-light-transparent.png  (light ink, no background)

Assumes the dev server is already running (manifest.json `baseUrl`); never starts it.
Pages are loaded with `?capture=1&theme=…&bg=…` (see js/mode.js), rendered at 2x DPR
onto a transparent canvas, and cropped to the alpha bounding box: the `.frame` box in
opaque modes, the ink plus 16 CSS px of padding in transparent modes.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlencode

from PIL import Image

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
DPR = 2
WINDOW_HEIGHT = 3000
TRANSPARENT_PAD = 16  # CSS px around the ink in transparent modes

VARIANTS = {
    'dark':              {'theme': 'dark',  'bg': 'opaque',      'suffix': ''},
    'light':             {'theme': 'light', 'bg': 'opaque',      'suffix': '-light'},
    'transparent':       {'theme': 'dark',  'bg': 'transparent', 'suffix': '-transparent'},
    'light-transparent': {'theme': 'light', 'bg': 'transparent', 'suffix': '-light-transparent'},
}


def capture(page, variant, base_url, out_dir, default_vp):
    v = VARIANTS[variant]
    width = page.get('viewport', default_vp)['width']
    query = {'capture': 1}
    if v['theme'] == 'light':
        query['theme'] = 'light'
    if v['bg'] == 'transparent':
        query['bg'] = 'transparent'
    url = f"{base_url}/{page['path']}?{urlencode(query)}"
    out_path = os.path.join(out_dir, f"{page['id']}{v['suffix']}.png")

    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, 'raw.png')
        for attempt in range(2):  # headless Chrome occasionally exits early under parallel load
            proc = subprocess.run([
                CHROME, '--headless', '--hide-scrollbars',
                f'--force-device-scale-factor={DPR}',
                '--default-background-color=00000000',
                '--virtual-time-budget=5000',
                f'--window-size={width},{WINDOW_HEIGHT}',
                f'--user-data-dir={os.path.join(tmp, f"profile{attempt}")}',
                f'--screenshot={raw}',
                url,
            ], capture_output=True, text=True)
            if proc.returncode == 0 and os.path.exists(raw):
                break
        else:
            raise RuntimeError(f'{page["id"]} [{variant}]: Chrome exited {proc.returncode}: '
                               f'{proc.stderr.strip()[-300:]}')
        img = Image.open(raw).convert('RGBA')

    bbox = img.getchannel('A').getbbox()
    if bbox is None:
        raise RuntimeError(f'{page["id"]} [{variant}]: blank capture ({url})')
    if bbox[3] >= img.height:
        raise RuntimeError(f'{page["id"]} [{variant}]: content touches the bottom edge, '
                           f'raise WINDOW_HEIGHT ({url})')
    if v['bg'] == 'transparent':
        pad = TRANSPARENT_PAD * DPR
        bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0),
                min(bbox[2] + pad, img.width), min(bbox[3] + pad, img.height))

    img.crop(bbox).save(out_path)
    return out_path


def main():
    with open('manifest.json') as f:
        manifest = json.load(f)
    pages_by_id = {p['id']: p for p in manifest['pages']}

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('ids', nargs='*', help='page ids from manifest.json')
    ap.add_argument('--all', action='store_true', help='capture every page in manifest.json')
    ap.add_argument('--variant', action='append', choices=VARIANTS, required=True,
                    help='repeatable; one output per page per variant')
    ap.add_argument('--base-url', default=manifest['baseUrl'], help='default: manifest baseUrl')
    ap.add_argument('--out-dir', default=manifest['outputDir'], help='default: manifest outputDir')
    ap.add_argument('--jobs', type=int, default=6)
    args = ap.parse_args()

    ids = list(pages_by_id) if args.all else args.ids
    unknown = [i for i in ids if i not in pages_by_id]
    if unknown or not ids:
        ap.error(f'unknown page ids: {unknown}' if unknown else 'give page ids or --all')

    os.makedirs(args.out_dir, exist_ok=True)
    jobs = [(pages_by_id[i], v) for i in ids for v in args.variant]
    failed = 0
    with ThreadPoolExecutor(args.jobs) as pool:
        futures = [pool.submit(capture, p, v, args.base_url.rstrip('/'), args.out_dir,
                               manifest['defaultViewport']) for p, v in jobs]
        for fut in futures:
            try:
                print(fut.result())
            except Exception as e:
                failed += 1
                print(f'FAILED: {e}', file=sys.stderr)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
