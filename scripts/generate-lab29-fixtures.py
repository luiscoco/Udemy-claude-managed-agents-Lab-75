"""Generate three tiny fictional fixtures for Lab 29; never reads user files."""
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'fixtures' / 'lab29'
OUT.mkdir(parents=True, exist_ok=True)

image = Image.new('RGB', (256, 256), '#e4f3f3')
draw = ImageDraw.Draw(image)
draw.ellipse((33, 145, 225, 241), fill='#c6ddca')
draw.line((46, 189, 217, 155), fill='#664c38', width=7)
draw.ellipse((86, 71, 187, 164), fill='#d36b38', outline='#573d2e', width=3)
draw.ellipse((163, 83, 205, 125), fill='#d36b38', outline='#573d2e', width=3)
draw.polygon([(201, 103), (229, 112), (201, 119)], fill='#e5a12a')
draw.ellipse((181, 93, 188, 100), fill='#1b2525')
draw.arc((94, 89, 163, 162), 210, 325, fill='#f8dd9d', width=12)
image.save(OUT / 'aurora-finch.png', format='PNG')

text = 'Aurora Finch fictional observation\nCount: 3\nCapture: offline\nHabitat: paper woodland\n'
(OUT / 'observation.txt').write_text(text, encoding='utf-8')
(OUT / 'downloaded-output.txt').write_text('Authored session output artifact: 3 fictional Aurora Finches.\n', encoding='utf-8')

doc = pymupdf.open()
page = doc.new_page(width=420, height=320)
page.insert_text((42, 52), 'Aurora Finch - fictional field note', fontsize=17, color=(0.10, 0.18, 0.20))
for index, line in enumerate(['Count: 3 birds', 'Capture mode: offline', 'Habitat: paper woodland',
                              'No real-world sighting data is present.']):
    page.insert_text((42, 92 + index * 30), line, fontsize=12)
doc.save(OUT / 'field-note.pdf')
doc.close()

check = pymupdf.open(OUT / 'field-note.pdf')
assert check.page_count == 1
assert 'Count: 3 birds' in check[0].get_text()
preview_dir = ROOT / 'artifacts' / 'lab29'
preview_dir.mkdir(parents=True, exist_ok=True)
preview = check[0].get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
preview.save(preview_dir / 'field-note-preview.png')
check.close()
