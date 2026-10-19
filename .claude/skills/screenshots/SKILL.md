---
name: screenshots
description: Capture PNG screenshots of diagram pages in this repo using the Chrome DevTools MCP. Use when the user asks to take, regenerate, or update screenshots / output images for one or more pages listed in manifest.json. Handles the full pipeline: viewport sizing, frame shrink-to-fit, and element-scoped capture.
---

# Screenshot Pipeline

Capture diagram page assets as PNGs in `output/`.

## Prerequisites

- The dev server must already be running on port **3333** (`npx serve . -p 3333`). The user starts it manually — do not start or stop it.
- Chrome DevTools MCP tools must be available (`mcp__plugin_chrome-devtools-mcp_chrome-devtools__*`).

## Steps

1. Run `./screenshots.sh` to list pages and their viewport widths from `manifest.json`.
2. For each target page, use Chrome MCP:
   a. `navigate_page` to `http://localhost:3333/pages/{page-id}.html`.
   b. `resize_page` to the manifest viewport width (height can stay default, e.g. 900).
   c. `evaluate_script` with `() => { document.querySelector('.frame').style.height = 'fit-content'; }` to shrink the frame to the card.
   d. `take_snapshot` with `verbose: true` to locate the `.frame` element's `uid`.
   e. `take_screenshot` with the `.frame` uid and `filePath: output/{page-id}.png` to auto-crop to content.

## Finding the `.frame` uid

The `.frame` is always `uid=X_2` (body → frame → card maps to `X_0` → `X_1` → `X_2`, and `.frame` is `X_2`'s parent — use the second `ignored` node under `RootWebArea`).

## Output

PNGs land in `output/{page-id}.png`. Overwrite existing files when regenerating.

## Theme and background variants (on request only)

The steps above produce the default dark image. When the user asks for light and/or
transparent versions, use `capture.py` (headless Chrome, which can render onto a
transparent canvas; the MCP screenshot can't):

```
python3 capture.py <page-id>... [--all] --variant light --variant transparent --variant light-transparent
```

| Variant             | Output                                  | Look                                   |
|---------------------|-----------------------------------------|----------------------------------------|
| `light`             | `output/{page-id}-light.png`            | light palette, card on light page      |
| `transparent`       | `output/{page-id}-transparent.png`      | dark-theme ink, no page/card background |
| `light-transparent` | `output/{page-id}-light-transparent.png`| light-theme ink, no page/card background|
| `dark`              | `output/{page-id}.png`                  | same as the default MCP capture        |

- Needs the dev server on 3333, like the MCP flow (`--base-url` overrides `manifest.json`).
- Output is 2x DPR. Opaque variants are cropped to `.frame`; transparent variants to the
  ink plus 16 CSS px of padding.
- Only produce variants the user asked for; don't regenerate `{page-id}.png` with `--variant dark`
  unless asked.

To preview a variant in a browser, add the URL params read by `js/mode.js`:
`?theme=light`, `?bg=transparent`, or both (`?theme=light&bg=transparent`). The gallery
(`index.html`) has toggles that append them to every link.

## Scope

Only capture the pages the user asked for. If they say "all pages" or "regenerate everything," iterate through every entry in `manifest.json`.
