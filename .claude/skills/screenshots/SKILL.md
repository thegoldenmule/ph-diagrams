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

## Scope

Only capture the pages the user asked for. If they say "all pages" or "regenerate everything," iterate through every entry in `manifest.json`.
