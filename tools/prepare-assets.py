"""Emit lightweight WebP images from this project's original assets.

Usage: python tools/prepare-assets.py   (needs Pillow; the products .venv has it)
Source: assets-source/. Output: public/assets/. Rebuild afterwards.
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets-source"
OUT = ROOT / "public" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

# name -> (max width, quality)
SCREENSHOTS = {
    "vingrade-landing-en": (1200, 80),
    "englow3-interface": (1200, 80),
    "ledgerlens-current": (1400, 82),
    "ledgerlens-review": (1400, 82),
    "relaydesk-current": (1400, 82),
    "relaydesk-receipt": (1400, 82),
}

for name, (width, quality) in SCREENSHOTS.items():
    image = Image.open(SOURCE / f"{name}.png").convert("RGB")
    if image.width > width:
        image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
    image.save(OUT / f"{name}.webp", "WEBP", quality=quality, method=6)

# Smaller copies for cards and timeline thumbnails (shown at about 400 px wide).
for name in ("vingrade-landing-en", "englow3-interface", "ledgerlens-current", "relaydesk-current"):
    image = Image.open(SOURCE / f"{name}.png").convert("RGB")
    image = image.resize((760, round(image.height * 760 / image.width)), Image.LANCZOS)
    image.save(OUT / f"{name}-card.webp", "WEBP", quality=78, method=6)

portrait = Image.open(SOURCE / "quang-anh-cutout.png").convert("RGBA")
portrait = portrait.resize((round(portrait.width * 900 / portrait.height), 900), Image.LANCZOS)
portrait.save(OUT / "quang-anh-cutout.webp", "WEBP", quality=86, method=6)

for path in sorted(OUT.glob("*.webp")):
    with Image.open(path) as im:
        print(f"{path.name:32} {im.width}x{im.height}  {path.stat().st_size // 1024} KB")
