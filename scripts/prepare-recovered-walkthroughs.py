"""Build and audit recovered decks without recording or rendering paid media."""
import json
import subprocess
import sys
from pathlib import Path

import cv2
import numpy as np
from presentation_highlights import fit_highlights

ROOT = Path(__file__).resolve().parents[1]
for argument in sys.argv[1:]:
    lab = int(argument)
    assert 46 <= lab <= 75
    project = f'managed-agents-lab{lab}-walkthrough'
    presentation = ROOT / 'presentations' / project
    out = ROOT / 'videos' / project
    commands = [
        [sys.executable, 'scripts/create-recovered-walkthrough.py', str(lab)],
        ['node', 'scripts/capture-recovered-walkthrough-slides.mjs', str(lab)],
        [sys.executable, 'scripts/create-recovered-walkthrough.py', str(lab)],
    ]
    if lab == 50:
        evidence = json.loads((presentation / 'platform/capture-evidence.json').read_text(encoding='utf-8'))
        if evidence.get('live_approved'):
            commands.insert(0, ['node', '--import', 'tsx', 'scripts/live-labs/audit-capstone-capture.ts'])
    for command in commands:
        subprocess.run(command, cwd=ROOT, check=True, timeout=300)
    plan = json.loads((out / 'narration-plan.json').read_text(encoding='utf-8'))
    geometry = json.loads((presentation / '.build/video/slides/geometry.json').read_text(encoding='utf-8'))
    assert len(plan['slides']) == len(geometry)
    panels, audit = [], []
    for row, geo in zip(plan['slides'], geometry):
        image = cv2.imread(str(presentation / f'.build/video/slides/slide-{row["slide"]:02}.png'))
        assert image.shape[:2] == (1080, 1920)
        for cue in row['segments']:
            fitted = fit_highlights(cue['target'], geo, image)
            assert fitted
            view = image.copy()
            for box in fitted:
                x, y, width, height = map(int, box['rect'])
                assert width > 0 and height > 0 and 0 <= x < x + width <= 1920 and 0 <= y < y + height <= 1080
                cv2.rectangle(view, (x,y), (x+width,y+height), (0,0,255), 4)
            thumb = cv2.resize(view, (640,360))
            cv2.putText(thumb, str(row['slide'])+' '+cue['id'], (10,348), 0, .6, (0,190,255), 2)
            panels.append(thumb)
            audit.append({'slide':row['slide'],'cue':cue['id'],'fitted':fitted})
    for i in range(0,len(panels),6):
        group = panels[i:i+6] + [np.zeros((360,640,3),np.uint8)] * (6-len(panels[i:i+6]))
        cv2.imwrite(str(out/f'highlight-audit-{i//6+1}.jpg'), np.vstack([np.hstack(group[:2]),np.hstack(group[2:4]),np.hstack(group[4:6])]))
    (out/'geometry-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
    print(f'Lab {lab}: {len(plan["slides"])} slides, {len(audit)} fitted highlights.',flush=True)
