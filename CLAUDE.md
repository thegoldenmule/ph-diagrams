This repo is for generating images, using web styling, for a series of articles.

- It should match the style of https://powerhouse.io/
- Static web page, static css.
- We should take screenshots of the rendered webpage to produce assets.

## Dev Server

- Port: **3333** — the user starts the server manually: `npx serve . -p 3333`
- **Do not start or stop the server from Claude Code.**
- Gallery page: http://localhost:3333/
- Individual pages live under `pages/` (one HTML file per image).

## Screenshots

To capture page assets, use the `screenshots` skill (see `.claude/skills/screenshots/SKILL.md`). Output PNGs go to `output/`.

## Adding a New Page

1. Create `pages/{page-id}.html` using the base template below
2. Add entry to `manifest.json` (with custom viewport if needed)
3. Add link card to `index.html` gallery
4. Capture via the `screenshots` skill

## Page Template Rules

Every page **must** follow these rules so layout and screenshots are consistent:

### Required page-level style overrides

```css
.frame {
  max-width: 700px;   /* or whatever the manifest viewport width is */
}
.card {
  height: auto;        /* let card shrink to content height */
  /* Do NOT set width: auto — card must remain width: 100% to fill the frame */
}
.card-body {
  flex: none;          /* prevent card-body from stretching */
}
```

### Key points

- **`.card` must keep `width: 100%`** (inherited from `components.css`). Setting `width: auto` causes the card to shrink-wrap its content, creating inconsistent horizontal padding between pages.
- **`.frame` padding** is set globally in `components.css` at `var(--space-lg)` (24px). Do not override per-page.
- **`.card` padding** is set globally at `var(--space-xl)` (32px). Do not override per-page.
- The resulting content width for a 700px viewport is: `700 - 48 (frame) - 64 (card) = 588px`.

### Color palette for diagram boxes

Use the `.box` pattern with accent classes. Available accents:
- `accent-cyan` — state / primary concept
- `accent-blue` — reducer / processing
- `accent-purple` — commands / inputs
- `accent-green` — events / outputs

Define `.box.accent-*` styles in each page's `<style>` block (they are not in `components.css`).
