This repo is for generating images, using web styling, for a series of articles.

- It should match the style of https://powerhouse.io/
- Static web page, static css.
- We should take screenshots of the rendered webpage to produce assets.

## Dev Server

- Port: **3333** — the user starts the server manually: `npx serve . -p 3333`
- **Do not start or stop the server from Claude Code.**
- Gallery page: http://localhost:3333/
- Individual pages live under `pages/` (one HTML file per image).

## Screenshot Pipeline

1. User starts the server: `npx serve . -p 3333`
2. Run `./screenshots.sh` to list pages from `manifest.json`
3. Use Chrome MCP via Claude Code to capture screenshots:
   a. Navigate to the page URL, resize to the manifest viewport width
   b. Run `evaluate_script` to set `.frame` height to `fit-content` (shrinks to card)
   c. Take a snapshot (`take_snapshot`) to find the `.frame` element uid
   d. Use `take_screenshot` with the `.frame` uid to auto-crop to content
4. Output PNGs go to `output/`

## Adding a New Page

1. Create `pages/{page-id}.html` using the base template (see existing examples)
2. Add entry to `manifest.json` (with custom viewport if needed)
3. Add link card to `index.html` gallery
4. Run screenshot pipeline to capture
