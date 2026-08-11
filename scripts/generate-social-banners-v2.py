from __future__ import annotations

from pathlib import Path

import freetype
import uharfbuzz as hb
from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BRAND_DIR = ROOT / "public" / "brand"
OUT_DIR = BRAND_DIR / "social" / "banners"
BACKGROUND = OUT_DIR / "plixfy-banner-background-master.png"
MARK = BRAND_DIR / "plixfy-mark-v2.png"
CHANGA = BRAND_DIR / "fonts" / "Changa-Variable.ttf"
OXANIUM = BRAND_DIR / "fonts" / "Oxanium-Variable.ttf"

ARABIC_TAGLINE = "\u0623\u0644\u0639\u0627\u0628 \u0645\u062c\u0627\u0646\u064a\u0629. \u0628\u062f\u0648\u0646 \u062a\u062d\u0645\u064a\u0644."

FORMATS = {
    "facebook": {"size": (1640, 624), "mark": 292, "brand": 126, "tag": 56, "url": 30, "tracking": 8},
    "x": {"size": (1500, 500), "mark": 230, "brand": 106, "tag": 46, "url": 27, "tracking": 7},
    "bluesky": {"size": (1500, 500), "mark": 230, "brand": 106, "tag": 46, "url": 27, "tracking": 7},
    "youtube": {"size": (2560, 1440), "mark": 330, "brand": 148, "tag": 64, "url": 34, "tracking": 10},
    "discord": {"size": (960, 540), "mark": 215, "brand": 92, "tag": 41, "url": 24, "tracking": 6},
    "twitch": {"size": (1200, 480), "mark": 215, "brand": 96, "tag": 43, "url": 25, "tracking": 6},
}


def font(path: Path, size: int, weight: int) -> ImageFont.FreeTypeFont:
    face = ImageFont.truetype(str(path), size)
    face.set_variation_by_axes([weight])
    return face


def cover_crop(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    width, height = size
    scale = max(width / image.width, height / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def tracked_mask(text: str, face: ImageFont.FreeTypeFont, tracking: int) -> Image.Image:
    widths = [face.getlength(char) for char in text]
    box = face.getbbox(text)
    height = box[3] - box[1]
    width = round(sum(widths) + tracking * max(0, len(text) - 1))
    mask = Image.new("L", (max(1, width), max(1, height)), 0)
    draw = ImageDraw.Draw(mask)
    cursor = 0.0
    for char, char_width in zip(text, widths):
        draw.text((round(cursor), -box[1]), char, font=face, fill=255)
        cursor += char_width + tracking
    return mask


def gradient_text(text: str, face: ImageFont.FreeTypeFont, tracking: int) -> Image.Image:
    mask = tracked_mask(text, face, tracking)
    gradient = Image.new("RGBA", mask.size)
    pixels = gradient.load()
    stops = ((0.0, (0, 229, 255)), (0.5, (129, 99, 255)), (1.0, (255, 0, 174)))
    for x in range(mask.width):
        t = x / max(1, mask.width - 1)
        if t <= 0.5:
            local = t / 0.5
            a, b = stops[0][1], stops[1][1]
        else:
            local = (t - 0.5) / 0.5
            a, b = stops[1][1], stops[2][1]
        color = tuple(round(a[i] + (b[i] - a[i]) * local) for i in range(3))
        for y in range(mask.height):
            pixels[x, y] = (*color, mask.getpixel((x, y)))
    return gradient


def shaped_arabic_mask(text: str, path: Path, size: int, weight: int) -> Image.Image:
    """Shape Arabic with HarfBuzz and rasterize the resulting glyphs with FreeType."""
    font_data = path.read_bytes()
    hb_face = hb.Face(font_data)
    hb_font = hb.Font(hb_face)
    hb.ot_font_set_funcs(hb_font)
    hb_font.scale = (size * 64, size * 64)
    hb_font.set_variations({"wght": float(weight)})

    buffer = hb.Buffer()
    buffer.add_str(text)
    buffer.direction = "rtl"
    buffer.script = "arab"
    buffer.language = "ar"
    hb.shape(hb_font, buffer, {"kern": True, "liga": True})

    ft_face = freetype.Face(str(path))
    ft_face.set_char_size(size * 64)
    try:
        ft_face.set_var_design_coords((weight,))
    except (AttributeError, freetype.FT_Exception):
        pass

    glyphs: list[tuple[Image.Image, float, float]] = []
    pen_x = 0.0
    pen_y = 0.0
    for info, position in zip(buffer.glyph_infos, buffer.glyph_positions):
        ft_face.load_glyph(info.codepoint, freetype.FT_LOAD_RENDER | freetype.FT_LOAD_TARGET_NORMAL)
        slot = ft_face.glyph
        bitmap = slot.bitmap
        if bitmap.width and bitmap.rows:
            glyph_image = Image.frombytes("L", (bitmap.width, bitmap.rows), bytes(bitmap.buffer))
            glyph_x = pen_x + position.x_offset / 64 + slot.bitmap_left
            glyph_y = -(pen_y + position.y_offset / 64) - slot.bitmap_top
            glyphs.append((glyph_image, glyph_x, glyph_y))
        pen_x += position.x_advance / 64
        pen_y += position.y_advance / 64

    min_x = min(x for _, x, _ in glyphs)
    min_y = min(y for _, _, y in glyphs)
    max_x = max(x + image.width for image, x, _ in glyphs)
    max_y = max(y + image.height for image, _, y in glyphs)
    mask = Image.new("L", (max(1, round(max_x - min_x)), max(1, round(max_y - min_y))), 0)
    for glyph_image, x, y in glyphs:
        mask.paste(glyph_image, (round(x - min_x), round(y - min_y)), glyph_image)
    return mask


def glow(layer: Image.Image, radius: int, opacity: float = 0.55) -> Image.Image:
    alpha = layer.getchannel("A").point(lambda value: round(value * opacity))
    result = Image.new("RGBA", layer.size, (0, 190, 255, 0))
    result.putalpha(alpha)
    return result.filter(ImageFilter.GaussianBlur(radius))


def render(name: str, spec: dict[str, object]) -> Path:
    width, height = spec["size"]  # type: ignore[misc]
    background = cover_crop(Image.open(BACKGROUND).convert("RGB"), (width, height)).convert("RGBA")

    # A restrained center vignette protects readability without hiding the generated world.
    shade = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    shade_draw = ImageDraw.Draw(shade)
    plate_w = min(round(width * 0.66), 1500)
    plate_h = min(round(height * 0.72), 610)
    plate_x = (width - plate_w) // 2
    plate_y = (height - plate_h) // 2
    shade_draw.rounded_rectangle(
        (plate_x, plate_y, plate_x + plate_w, plate_y + plate_h),
        radius=max(24, round(height * 0.045)),
        fill=(2, 4, 25, 92),
        outline=(119, 76, 255, 38),
        width=max(1, round(height * 0.003)),
    )
    background.alpha_composite(shade)

    mark_size = int(spec["mark"])
    mark = Image.open(MARK).convert("RGBA").resize((mark_size, mark_size), Image.Resampling.LANCZOS)
    brand_face = font(OXANIUM, int(spec["brand"]), 800)
    url_face = font(OXANIUM, int(spec["url"]), 650)
    brand = gradient_text("PLIXFY", brand_face, int(spec["tracking"]))
    tag = shaped_arabic_mask(ARABIC_TAGLINE, CHANGA, int(spec["tag"]), 750)
    tag_w, tag_h = tag.size
    url = tracked_mask("PLIXFY.COM", url_face, max(2, int(spec["tracking"]) // 2))

    text_w = max(brand.width, tag_w, url.width)
    gap = round(mark_size * 0.15)
    group_w = mark_size + gap + text_w
    group_x = (width - group_w) // 2
    mark_x = group_x
    mark_y = (height - mark_size) // 2
    text_x = mark_x + mark_size + gap

    # Optical vertical centering of the three text rows.
    total_text_h = brand.height + round(height * 0.045) + tag_h + round(height * 0.025) + url.height
    text_y = (height - total_text_h) // 2

    background.alpha_composite(mark, (mark_x, mark_y))

    brand_layer = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    brand_pos = (text_x + (text_w - brand.width) // 2, text_y)
    brand_layer.alpha_composite(brand, brand_pos)
    background.alpha_composite(glow(brand_layer, max(6, round(height * 0.015)), 0.38))
    background.alpha_composite(brand_layer)

    tag_y = text_y + brand.height + round(height * 0.045)
    tag_x = text_x + (text_w - tag_w) // 2
    tag_shadow = tag.filter(ImageFilter.GaussianBlur(max(2, round(height * 0.005))))
    shadow_layer = Image.new("RGBA", tag.size, (26, 5, 50, 0))
    shadow_layer.putalpha(tag_shadow.point(lambda value: round(value * 0.9)))
    background.alpha_composite(shadow_layer, (tag_x + 2, tag_y + 3))
    tag_layer = Image.new("RGBA", tag.size, (246, 248, 255, 0))
    tag_layer.putalpha(tag)
    background.alpha_composite(tag_layer, (tag_x, tag_y))

    url_y = tag_y + tag_h + round(height * 0.025)
    url_color = Image.new("RGBA", url.size, (41, 218, 255, 0))
    url_color.putalpha(url)
    background.alpha_composite(url_color, (text_x + (text_w - url.width) // 2, url_y))

    out = OUT_DIR / f"plixfy-banner-{name}-v2-{width}x{height}.jpg"
    background.convert("RGB").save(out, quality=94, optimize=True, progressive=True)
    return out


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, spec in FORMATS.items():
        print(render(name, spec))


if __name__ == "__main__":
    main()
