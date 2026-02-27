#!/bin/bash
# screenshots.sh — Print page info from manifest.json for screenshotting.
# Assumes the server is already running (e.g. `npx serve . -p 3333`).

set -euo pipefail

MANIFEST="manifest.json"
OUTPUT_DIR=$(python3 -c "import json; print(json.load(open('$MANIFEST'))['outputDir'])")
BASE_URL=$(python3 -c "import json; print(json.load(open('$MANIFEST'))['baseUrl'])")

mkdir -p "$OUTPUT_DIR"

echo ""
echo "=== Screenshot Manifest ==="
echo ""

# Parse manifest and print page info
python3 -c "
import json

with open('$MANIFEST') as f:
    manifest = json.load(f)

base = manifest['baseUrl']
default_vp = manifest['defaultViewport']
output_dir = manifest['outputDir']

for page in manifest['pages']:
    vp = page.get('viewport', default_vp)
    url = f\"{base}/{page['path']}\"
    output = f\"{output_dir}/{page['output']}\"
    print(f\"  ID:       {page['id']}\")
    print(f\"  URL:      {url}\")
    print(f\"  Viewport: {vp['width']}x{vp['height']}\")
    print(f\"  Output:   {output}\")
    print(f\"  Desc:     {page.get('description', '')}\")
    print()
"

echo "Use Chrome MCP to capture screenshots from the running server at $BASE_URL"
