"""Create a silent local review MP4 without external calls or credentials."""
from pathlib import Path
import json
import shutil
import subprocess
import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / 'presentations/gcp-cloud-run-deployment'
V = ROOT / 'videos/gcp-cloud-run-deployment'
build = P / '.build/video/preview'
build.mkdir(parents=True, exist_ok=True)
shots = [1, 2, 7, 9, 11, 15, 18, 20, 23, 24, 27, 28]
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
clips = []
for number in shots:
    target = build / f'{number:02}.mp4'
    command = [ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i',
               str(P / f'.build/video/slides/slide-{number:02}.png'), '-t', '4', '-r', '30',
               '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-an', str(target)]
    subprocess.run(command, check=True)
    clips.append(target)
listing = build / 'concat.txt'
listing.write_text('\n'.join("file '" + clip.as_posix() + "'" for clip in clips), encoding='utf-8')
target = V / 'Google-Cloud-Deployment-Silent-Preview.mp4'
subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i',
                str(listing), '-c', 'copy', '-movflags', '+faststart', str(target)], check=True)
subprocess.run([ffmpeg, '-v', 'error', '-i', str(target), '-f', 'null', '-'], check=True)
shutil.copy2(ROOT / 'gcp/README.md', V / 'student-deployment-guide.md')
shutil.copy2(P / '.build/video/slides/slide-01.png', V / 'cover.png')
(V / 'preview-validation.json').write_text(json.dumps({'file': target.name, 'seconds': 48,
    'selectedScenes': shots, 'audio': 'none; silent local preview', 'fullDecode': 'passed'}, indent=2))
print('Verified 48-second silent preview from 12 representative scenes.')
