"""Inspect a bounded PNG and propose a high-contrast infographic palette."""
import io
import json
import sys
import colorsys
from collections import Counter
from PIL import Image, UnidentifiedImageError

data = sys.stdin.buffer.read(5_000_001)
if len(data) > 5_000_000 or not data.startswith(b'\x89PNG\r\n\x1a\n'):
    raise SystemExit('Choose a valid PNG under 5 MB.')
try:
    image = Image.open(io.BytesIO(data))
    if image.format != 'PNG' or image.width > 6000 or image.height > 6000 or image.width * image.height > 20_000_000:
        raise ValueError('PNG dimensions exceed the project limit.')
    image.load()
except (UnidentifiedImageError, OSError, ValueError) as exc:
    raise SystemExit(str(exc))

rgb = image.convert('RGB')
sample = rgb.copy()
sample.thumbnail((160, 160))
colors = Counter(tuple((channel // 16) * 16 + 8 for channel in pixel) for pixel in sample.get_flattened_data())
ranked = colors.most_common(700)
light = [(color, count) for color, count in ranked if min(color) >= 216 and max(color) - min(color) <= 36]
light_fraction = sum(count for _, count in light) / max(1, sum(colors.values()))
background = max(light, key=lambda row: row[1])[0] if light and light_fraction >= .22 else colors.most_common(1)[0][0]
brightness = sum(background) / 3

def hsv(color):
    return colorsys.rgb_to_hsv(*(channel / 255 for channel in color))

def pick(predicate, fallback):
    return next((color for color, count in ranked if count >= 2 and predicate(color, *hsv(color))), fallback)

orange = pick(lambda color, hue, saturation, value: 0.025 <= hue <= 0.13 and saturation >= .45 and value >= .55, (240, 112, 48))
blue = pick(lambda color, hue, saturation, value: .49 <= hue <= .72 and saturation >= .42 and value >= .45, (38, 126, 216))
if sum(abs(orange[i] - blue[i]) for i in range(3)) < 120:
    blue = (38, 126, 216)
dark_pixels = sum(count for color, count in colors.items() if sum(color) / 3 < 78)
dark_fraction = dark_pixels / max(1, sum(colors.values()))
layout = 'technical' if brightness >= 190 and dark_fraction >= .06 else 'cards'

def hex_color(color):
    return '#' + ''.join(f'{component:02X}' for component in color)

print(json.dumps({
    'width': image.width,
    'height': image.height,
    'style': {
        'background': hex_color(background),
        'ink': '#10234A' if brightness >= 150 else '#F4F8FF',
        'accent': hex_color(orange),
        'secondary': hex_color(blue),
        'mood': 'light' if brightness >= 150 else 'dark',
        'layout': layout,
    },
}))
