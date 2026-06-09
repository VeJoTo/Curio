#!/usr/bin/env sh
# Regenerate Curio's PNG brand assets from the source SVGs.
# Requires: rsvg-convert, magick (ImageMagick). Run from anywhere.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/.."
tmp="$(mktemp -d)"

# Cream-filled "c" (for the teal-background icon) — recolor the teal fill to cream.
sed 's/#43897D/#FBF6EA/g' "$here/curio-app-icon.svg" > "$tmp/c-cream.svg"

# iOS / base icon: teal #43897D canvas, cream "c" centred (~600px tall in 1024).
rsvg-convert -h 600 "$tmp/c-cream.svg" -o "$tmp/c600.png"
magick -size 1024x1024 xc:'#43897D' "$tmp/c600.png" -gravity center -composite "$out/icon.png"

# Android adaptive foreground: transparent, cream "c" smaller (~480px) to sit inside the safe zone.
rsvg-convert -h 480 "$tmp/c-cream.svg" -o "$tmp/c480.png"
magick -size 1024x1024 xc:none "$tmp/c480.png" -gravity center -composite "$out/adaptive-icon.png"

# Web favicon: the icon scaled down.
magick "$out/icon.png" -resize 48x48 "$out/favicon.png"

# Wordmark: native teal, transparent, 3x (~618px wide).
rsvg-convert -w 618 "$here/curio-logo.svg" -o "$out/curio-wordmark.png"

echo "Wrote icon.png, adaptive-icon.png, favicon.png, curio-wordmark.png to $out"
