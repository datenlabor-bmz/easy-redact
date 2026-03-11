#!/usr/bin/env bash
set -euo pipefail

OUT="${1:-out}"
mkdir -p "$OUT" "$OUT/tmp"

for f in "$(dirname "$0")"/[0-9]*.md; do
  base=$(basename "$f" .md)

  # Strip the download banner line
  sed '/^> 📥/d' "$f" > "$OUT/tmp/${base}.md"

  # Render mermaid blocks to PNGs via mermaid-cli, replacing ```mermaid blocks with ![](image)
  if grep -q '```mermaid' "$OUT/tmp/${base}.md"; then
    mmdc -i "$OUT/tmp/${base}.md" -o "$OUT/tmp/${base}.md" -e png -w 2400 -s 3 --quiet 2>/dev/null || true
  fi

  pandoc "$OUT/tmp/${base}.md" \
    -o "$OUT/${base}.docx" \
    --from=gfm \
    --to=docx \
    -V lang=de \
    --toc \
    --toc-depth=2 \
    --resource-path="$OUT/tmp"

  echo "✓ ${base}.docx"
done

rm -rf "$OUT/tmp"
echo "Done — $(ls "$OUT"/*.docx | wc -l | tr -d ' ') files in $OUT/"
