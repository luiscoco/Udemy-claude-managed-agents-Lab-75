"""Tighten final authored geometry without changing narration or app pixels."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'presentations/managed-agents-platform-walkthrough'
e=json.loads((P/'platform/capture-evidence.json').read_text(encoding='utf-8'))
next(c for s in e['shots'] if s['id']=='exercise' for c in s['cues'] if c['id']=='prompt')['rect']=[851,298,607,25]
next(c for s in e['shots'] if s['id']=='map' for c in s['cues'])['rect']=[544,195,337,32]
next(c for s in e['shots'] if s['id']=='source' for c in s['cues'])['rect']=[560,193,402,23]
(P/'platform/capture-evidence.json').write_text(json.dumps(e,indent=2))
source=ROOT/'scripts/create-managed-platform-walkthrough.py';t=source.read_text(encoding='utf-8');source.write_text(t.replace('left:88px;top:400px;width:1140px','left:88px;top:370px;width:1140px'))
# A changed cover must also regenerate the first cube's endpoint frames.
cube=P/'.build/video/cube-01.mp4';assert cube.resolve().is_relative_to(P.resolve())
if cube.exists():cube.unlink()
print('Tight prompt/title text bounds and clear cover footer prepared.')
