#!/usr/bin/env sh
# Regenerate Curio's PNG brand assets from the source files in this folder.
# Requires: rsvg-convert, magick (ImageMagick). Run from anywhere.
set -e
here="$(cd "$(dirname "$0")" && pwd)"
out="$here/.."
tmp="$(mktemp -d)"

# Brand mint background (sampled from the provided icon design).
MINT='#AED6C6'

# iOS / base icon: the provided hand-made icon, flattened onto opaque mint at 1024x1024
# (iOS icons must be opaque square; the source has transparent rounded corners).
magick "$here/curio-app-icon-source.png" -background "$MINT" -flatten -resize 1024x1024 "$out/icon.png"

# Web favicon: the icon scaled down.
magick "$out/icon.png" -resize 48x48 "$out/favicon.png"

# Android adaptive foreground: the deep-teal "c" (its native colors) on transparent,
# sized to sit inside Android's safe zone. The mint background is set in app.json.
rsvg-convert -h 480 "$here/curio-app-icon.svg" -o "$tmp/c480.png"
magick -size 1024x1024 xc:none "$tmp/c480.png" -gravity center -composite "$out/adaptive-icon.png"

# Wordmark: native teal, transparent, 3x (~618px wide).
rsvg-convert -w 618 "$here/curio-logo.svg" -o "$out/curio-wordmark.png"

echo "Wrote icon.png, adaptive-icon.png, favicon.png, curio-wordmark.png to $out"
