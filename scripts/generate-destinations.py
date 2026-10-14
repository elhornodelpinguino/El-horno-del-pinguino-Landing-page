"""Generate the final-CTA delivery destinations as pixel-art PNGs.

Drawn to match the penguin sprites: thick black outline, flat colours taken
from the penguin palette, front view, and a kawaii face. Each building ships
in two states: asleep (lights off, eyes closed) and awake (lights on, eyes
open, blush), swapped by final-cta-animation.js when the order arrives.

Run: python3 scripts/generate-destinations.py   (requires Pillow)
Writes: public/destinations/<slug>.png and <slug>-lit.png, 96x96.
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SIZE = 96
GROUND = 90  # last row a building may paint before the outline

INK = (0, 0, 0, 255)
MAGENTA = (184, 0, 64, 255)
MAGENTA_DEEP = (120, 8, 56, 255)
ORANGE = (248, 144, 8, 255)
CREAM = (248, 240, 208, 255)
CREAM_SHADE = (248, 208, 152, 255)
BROWN = (144, 80, 40, 255)
YELLOW = (248, 184, 32, 255)
GLOW = (248, 232, 200, 255)
WINDOW_OFF = (58, 31, 38, 255)
BLUSH = (255, 143, 166, 255)
BLUSH_SOFT = (248, 200, 196, 255)
WHITE = (255, 255, 255, 255)

OUT = Path(__file__).resolve().parent.parent / "public" / "destinations"


def box(d, x0, y0, x1, y1, fill):
    d.rectangle([x0, y0, x1, y1], fill=fill, outline=INK, width=2)


def wall(d, x0, y0, x1, y1):
    """Cream wall with a shaded right edge, like the penguin's side shading."""
    box(d, x0, y0, x1, y1, CREAM)
    d.rectangle([x1 - 7, y0 + 2, x1 - 2, y1 - 2], fill=CREAM_SHADE)


def window(d, x0, y0, x1, y1, lit):
    box(d, x0, y0, x1, y1, YELLOW if lit else WINDOW_OFF)
    if lit:
        d.rectangle([x0 + 3, y0 + 3, x0 + 5, y0 + 5], fill=GLOW)
    mx = (x0 + x1) // 2
    d.line([mx, y0 + 2, mx, y1 - 2], fill=INK, width=1)


def door(d, cx, y0, w, lit):
    box(d, cx - w // 2, y0, cx + w // 2, GROUND, BROWN)
    d.rectangle([cx + w // 2 - 5, (y0 + GROUND) // 2, cx + w // 2 - 4, (y0 + GROUND) // 2 + 1], fill=YELLOW if lit else ORANGE)


def oval(d, x0, y0, x1, y1, fill):
    """Pixel oval: a rectangle with its four corner pixels knocked off."""
    d.rectangle([x0, y0, x1, y1], fill=fill)
    if x1 - x0 >= 3 and y1 - y0 >= 3:
        for x, y in ((x0, y0), (x1, y0), (x0, y1), (x1, y1)):
            d.point((x, y), fill=None)


def face(d, cx, cy, lit, scale=1, zzz=None):
    """Kawaii face drawn like the penguin's: tall oval eyes with a double
    sparkle, soft pink blush and a tiny mouth.

    Asleep: curved closed eyes, faint blush, small "o" mouth, and a "z" above
    the building at `zzz`. Awake: open eyes, full blush, open smile.
    `scale=0` is a compact face for tight spots like the school clock.
    """
    gap = 8 if scale else 6
    eye_w, eye_h = (5, 7) if scale else (3, 5)
    for side in (-1, 1):
        ex = cx + side * gap
        x0, y0 = ex - eye_w // 2, cy - eye_h // 2
        x1, y1 = x0 + eye_w - 1, y0 + eye_h - 1
        bx = ex + side * (3 if scale else 2)
        if lit:
            oval(d, x0, y0, x1, y1, INK)
            d.rectangle([x0 + 1, y0 + 1, x0 + (2 if scale else 1), y0 + (2 if scale else 1)], fill=WHITE)
            if scale:
                d.point((x1 - 1, y1 - 1), fill=WHITE)
            oval(d, bx - 2, y1 + 2, bx + 2, y1 + 3 + scale, BLUSH)
        else:
            # Closed eye: a downward curve, two pixels thick like the outline.
            d.line([x0 - 1, cy, x0, cy + 1, x1, cy + 1, x1 + 1, cy], fill=INK, width=1)
            d.line([x0, cy + 2, x1, cy + 2], fill=INK, width=1)
            oval(d, bx - 2, y1 + 2, bx + 2, y1 + 2 + scale, BLUSH_SOFT)
    my = cy + eye_h // 2 + 3
    if lit:
        # Open smile: black rim, pink tongue.
        d.line([cx - 3, my, cx - 2, my + 2, cx + 2, my + 2, cx + 3, my], fill=INK, width=1)
        if scale:
            d.line([cx - 1, my + 1, cx + 1, my + 1], fill=BLUSH)
    else:
        oval(d, cx - 1, my, cx + 1, my + 2, INK)
    if zzz and not lit:
        zx, zy = zzz
        for i, (dx, dy, n) in enumerate(((0, 0, 5), (6, -6, 4))):
            x, y = zx + dx, zy + dy
            d.line([x, y, x + n - 1, y], fill=WHITE, width=1)
            d.line([x + n - 1, y, x, y + n - 1], fill=WHITE, width=1)
            d.line([x, y + n - 1, x + n - 1, y + n - 1], fill=WHITE, width=1)


def outline(img, thickness=2):
    """Thick exterior outline: dilate the silhouette and paint the rim black."""
    alpha = img.getchannel("A").point(lambda a: 255 if a > 0 else 0)
    grown = alpha.filter(ImageFilter.MaxFilter(thickness * 2 + 1))
    rim = ImageChops.subtract(grown, alpha)
    black = Image.new("RGBA", img.size, INK)
    out = img.copy()
    out.paste(black, mask=rim)
    return out


def casa(d, lit):
    d.rectangle([62, 18, 70, 40], fill=MAGENTA_DEEP, outline=INK, width=2)  # chimney
    d.polygon([(10, 48), (48, 14), (86, 48)], fill=MAGENTA, outline=INK, width=2)
    d.polygon([(48, 22), (78, 48), (70, 48), (48, 28)], fill=MAGENTA_DEEP)
    wall(d, 18, 46, 78, GROUND)
    window(d, 23, 52, 36, 64, lit)
    window(d, 60, 52, 73, 64, lit)
    face(d, 48, 57, lit, zzz=(74, 20))
    door(d, 48, 68, 16, lit)


def club(d, lit):
    d.line([20, 4, 20, 40], fill=INK, width=3)  # flag pole
    d.polygon([(22, 6), (40, 12), (22, 19)], fill=ORANGE, outline=INK, width=2)
    d.polygon([(22, 9), (32, 12), (22, 16)], fill=YELLOW)
    wall(d, 8, 40, 88, GROUND)
    box(d, 4, 34, 92, 44, MAGENTA)  # roof slab
    for i, x in enumerate(range(10, 88, 12)):  # striped awning
        d.polygon([(x, 44), (x + 12, 44), (x + 12, 52), (x + 6, 55), (x, 52)], fill=MAGENTA if i % 2 == 0 else CREAM, outline=INK, width=1)
    window(d, 13, 60, 27, 72, lit)
    window(d, 69, 60, 83, 72, lit)
    face(d, 48, 58, lit, zzz=(70, 18))
    box(d, 36, 70, 60, GROUND, BROWN)  # double door
    d.line([48, 72, 48, GROUND - 2], fill=INK, width=2)


def escuela(d, lit):
    d.rectangle([46, 2, 48, 10], fill=INK)  # bell spire
    d.polygon([(34, 22), (47, 8), (60, 22)], fill=MAGENTA, outline=INK, width=2)
    box(d, 34, 22, 60, 50, CREAM)  # tower
    d.ellipse([38, 26, 56, 44], fill=YELLOW if lit else CREAM_SHADE, outline=INK, width=2)  # clock face
    face(d, 47, 34, lit, scale=0, zzz=(66, 14))
    d.polygon([(4, 56), (20, 44), (76, 44), (92, 56)], fill=MAGENTA, outline=INK, width=2)
    d.rectangle([22, 47, 74, 53], fill=MAGENTA_DEEP)
    wall(d, 8, 54, 88, GROUND)
    for x in (13, 29, 57, 73):
        window(d, x, 60, x + 11, 71, lit)
    door(d, 48, 66, 14, lit)


def oficina(d, lit):
    d.line([48, 2, 48, 14], fill=INK, width=2)  # antenna
    d.rectangle([46, 0, 50, 3], fill=ORANGE)
    box(d, 24, 12, 72, 18, MAGENTA)  # roof cap
    wall(d, 26, 18, 70, GROUND)
    face(d, 48, 27, lit, zzz=(76, 6))
    for y in range(38, 74, 11):
        for x in (31, 43, 55):
            window(d, x, y, x + 9, y + 7, lit)
    door(d, 48, 78, 12, lit)


BUILDINGS = {"casa": casa, "club": club, "escuela": escuela, "oficina": oficina}


def render(draw_fn, lit):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw_fn(ImageDraw.Draw(img), lit)
    return outline(img)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for slug, draw_fn in BUILDINGS.items():
        render(draw_fn, lit=False).save(OUT / f"{slug}.png", optimize=True)
        render(draw_fn, lit=True).save(OUT / f"{slug}-lit.png", optimize=True)
    print(f"wrote {len(BUILDINGS) * 2} sprites to {OUT}")


if __name__ == "__main__":
    main()
