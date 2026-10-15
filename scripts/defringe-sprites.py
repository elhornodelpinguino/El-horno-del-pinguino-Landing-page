#!/usr/bin/env python3
"""Remove the white cut-out halo from the pixel-art penguin sprites.

The sprites were generated on a white background and cut out afterwards, so
the outer edge keeps pixels that are a blend of a sprite colour and that
white: light-blue specks around the navy body, grey dots around the chef hat.
On cream they disappear; on the dark theme they read as a bad cut-out.

A pixel is removed (made transparent) when all of these hold:
  * it touches the exterior transparency (4-neighbourhood), and
  * it is lighter than an opaque inner neighbour and sits on the line from
    that neighbour's colour towards white (a white blend), or it is an
    isolated light speck with fewer than two opaque neighbours.
Solid light regions such as the chef hat survive: a near-white pixel with
three or more light neighbours is part of the region, not a halo. Removal
is limited to the two outermost rings of the original cut-out.

Usage: python3 scripts/defringe-sprites.py public/penguin-sprite.png [...]
Writes each file in place; the originals stay in git history.
"""

import sys

from PIL import Image

WHITE = (255, 255, 255)
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
N8 = N4 + ((1, 1), (1, -1), (-1, 1), (-1, -1))


def luminance(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def white_blend(pixel, inner):
    """True if pixel ~= inner + t * (white - inner) for a meaningful t."""
    ts = []
    for c in range(3):
        span = WHITE[c] - inner[c]
        if span < 24:  # inner channel already near white: carries no signal
            continue
        ts.append((pixel[c] - inner[c]) / span)
    if len(ts) < 2:
        return False
    t = sum(ts) / len(ts)
    spread = max(ts) - min(ts)
    return 0.18 <= t <= 0.95 and spread <= 0.35


def defringe(img, allowed=None):
    img = img.convert("RGBA")
    w, h = img.size
    src = img.load()
    out = img.copy()
    dst = out.load()

    def opaque(x, y):
        return 0 <= x < w and 0 <= y < h and src[x, y][3] > 0

    removed = 0
    for y in range(h):
        for x in range(w):
            p = src[x, y]
            if p[3] == 0 or luminance(p) < 110:
                continue
            if all(opaque(x + dx, y + dy) for dx, dy in N4):
                continue  # not on the outer edge
            if allowed is not None and (x, y) not in allowed:
                continue
            inner = [src[x + dx, y + dy] for dx, dy in N8 if opaque(x + dx, y + dy)]
            isolated = len(inner) < 2
            # Part of a solid light region (the hat): never a halo.
            if not isolated and luminance(p) > 225 and sum(luminance(q) > 200 for q in inner) >= 3:
                continue
            blended = any(luminance(q) < luminance(p) - 18 and white_blend(p, q) for q in inner)
            if isolated or blended:
                dst[x, y] = (0, 0, 0, 0)
                removed += 1
    return out, removed


def outer_rings(img, depth):
    """Opaque pixels within `depth` steps of the original exterior."""
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    ring = {(x, y) for y in range(h) for x in range(w)
            if px[x, y][3] > 0 and any(
                not (0 <= x + dx < w and 0 <= y + dy < h) or px[x + dx, y + dy][3] == 0
                for dx, dy in N4)}
    reach, frontier = set(ring), ring
    for _ in range(depth - 1):
        frontier = {(x + dx, y + dy) for x, y in frontier for dx, dy in N4
                    if 0 <= x + dx < w and 0 <= y + dy < h and px[x + dx, y + dy][3] > 0} - reach
        reach |= frontier
    return reach


def main(paths):
    # Two passes, bounded to the two outermost pixel rings of the original
    # cut-out: a halo is at most two pixels deep, and the bound keeps the
    # passes from creeping into thin light details (steam, shirts, hats).
    for path in paths:
        img = Image.open(path).convert("RGBA")
        allowed = outer_rings(img, 2)
        total = 0
        for _ in range(2):
            img, removed = defringe(img, allowed)
            total += removed
        img.save(path, optimize=True)
        print(f"{path}: removed {total} halo pixels")


if __name__ == "__main__":
    main(sys.argv[1:])
