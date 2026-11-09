"""Check native text targets before narration and produce a visual review sheet."""
from pathlib import Path
import json, subprocess, sys
import cv2
from PIL import Image, ImageDraw
from presentation_highlights import fit_highlights

ROOT = Path(__file__).resolve().parents[1]
V = ROOT / 'videos/ai-tutor-live-lab'
P = ROOT / 'presentations/ai-tutor-live-lab/.build/video/slides'
plan = json.loads((V / 'narration-plan.json').read_text(encoding='utf-8'))
geometry = json.loads((P / 'geometry.json').read_text(encoding='utf-8'))
sheet = Image.new('RGB', (1600, ((len(plan['slides'])+3)//4)*250), '#e8e3dc')
draw = ImageDraw.Draw(sheet)
count = 0
for index, row in enumerate(plan['slides']):
    image = cv2.imread(str(P / f'slide-{index+1:02}.png'))
    assert image.shape[:2] == (1080, 1920)
    for segment in row['segments']:
        targets = fit_highlights(segment['target'], geometry[index], image)
        count += len(targets)
        for item in targets:
            x, y, w, h = item['rect']
            cv2.rectangle(image, (x, y), (x+w, y+h), (36, 36, 255), 3)
    thumb = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    thumb.thumbnail((396, 223))
    x, y = index % 4 * 400, index // 4 * 250
    draw.text((x+5, y+4), f'Scene {index+1:02}', fill='black')
    sheet.paste(thumb, (x+2, y+23))
sheet.save(V / 'visual-review.jpg', quality=94)
(V / 'visual-validation.json').write_text(json.dumps({'scenes': len(plan['slides']), 'measuredTextHighlights': count, 'textFitting': 'passed'}, indent=2), encoding='utf-8')
print(f'All {len(plan["slides"])} scenes and {count} text highlights fitted.')
if '--silent-preview' in sys.argv:
    import imageio_ffmpeg
    concat = P.parent / 'silent-preview.txt'
    concat.write_text('\n'.join(f"file '{(P / f'slide-{index+1:02}.png').as_posix()}'\nduration 5" for index in range(len(plan['slides']))) + f"\nfile '{(P / f'slide-{len(plan["slides"]):02}.png').as_posix()}'\n", encoding='utf-8')
    result = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(concat), '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-threads', '2', '-an', '-movflags', '+faststart', '-metadata', 'title=AI Tutor Live Lab - SILENT STORYBOARD PREVIEW', str(V / 'AI-Tutor-Live-Lab-SILENT-PREVIEW.mp4')], capture_output=True)
    assert result.returncode == 0, result.stderr.decode(errors='replace')[-1500:]
    print('Created silent storyboard preview; final narrated MP4 remains pending.')
