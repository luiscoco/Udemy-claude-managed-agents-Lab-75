"""Author readable full-screen app close-ups and a platform-image course end card."""
from pathlib import Path
import json,shutil
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-udemy-promo-zoom-v3'
P=ROOT/'presentations'/NAME;OUT=ROOT/'videos'/NAME;P.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
shutil.copy2(Path('C:/Users/luis.coco/Downloads/image.png'),P/'learning-platform.png')
shutil.copy2(ROOT/'presentations/agent-sdk-free-course-promo-v2/assets/author-photo.png',P/'author-photo.png')
CAP=ROOT/'presentations/agent-sdk-complete-browser-tour-v3/capture'
for n in [39,40]:shutil.copy2(CAP/f'scene-{n:02}.png',P/f'app-{n:02}.png')
focus={
 'input':{'sourceScene':39,'crop':[134,145,748,516],'completeControls':['Prompt field','Model and working directory','Turn and spending limits','Run query button']},
 'result':{'sourceScene':40,'crop':[934,120,654,466],'completeControls':['Result heading','Success, turns and reported cost','Complete answer and file list']},
 'settings':{'sourceScene':39,'crop':[134,492,748,168],'completeControls':['Model','Tool and working directory','Turn and spending limits','Run query button']}}
for f in focus.values():
 x,y,w,h=f['crop'];scale=min(1792/w,810/h);dw=round(w*scale);dh=round(h*scale)
 f['displayRect']=[round(64+(1792-dw)/2),round(181+(810-dh)/2),dw,dh];f['scaleFromCapture']=dw/w
shots=[
 {'id':'instructor','start':3.4,'end':8.0,'cues':['welcome-1']},
 {'id':'welcome-input','start':8.0,'end':11.8,'focus':'input','cues':['welcome-2'],'heading':'Runnable learning applications','sub':'A real Claude Agent SDK example you can follow'},
 {'id':'welcome-result','start':11.8,'end':23.0,'focus':'result','cues':['welcome-3'],'heading':'From your first request to a verified result','sub':'Read the actual answer, outcome, turns, and reported cost'},
 {'id':'benefit-input','start':23.4,'end':29.2,'focus':'input','cues':['benefit-1'],'heading':'Run your first agent','sub':'Set up a small app and send a focused task with query()'},
 {'id':'benefit-result','start':29.2,'end':33.5,'focus':'result','cues':['benefit-2'],'heading':'Read real execution evidence','sub':'Follow tool activity and check the final result'},
 {'id':'benefit-settings','start':33.5,'end':43.0,'focus':'settings','cues':['benefit-3'],'heading':'Configure a bounded run','sub':'Working directory · tools · turn limit · estimated spending'},
 {'id':'platform','start':88.4,'end':106.0,'cues':['next-0','next-1','next-2','next-3','next-4']}]
style='''*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#090d3b;background:#081d37}.shot{position:relative;width:1920px;height:1080px;overflow:hidden;display:none;background:radial-gradient(ellipse at 98% 2%,#deefff,transparent 40%),#f5faff}.shot.active{display:block}.head{position:absolute;left:56px;right:56px;top:24px;height:140px;padding:17px 25px;background:white;border:1px solid #dae9f8;border-radius:24px}h1{font-size:46px;line-height:1.14;margin:0 0 14px;width:max-content;max-width:100%;letter-spacing:-.7px}.head p{font-size:30px;margin:0;color:#3e5974}.crop{position:absolute;overflow:hidden;background:white;border-radius:12px;box-shadow:0 8px 30px #09264718}.crop img{position:absolute;max-width:none}.foot{position:absolute;bottom:20px;left:65px;right:65px;font-size:21px;letter-spacing:.5px;color:#557596}.instructor-grid{display:flex;gap:90px;align-items:center;position:absolute;left:140px;top:245px;right:120px}.portrait{width:440px;height:444px;object-fit:contain;border-radius:40px;box-shadow:0 0 45px #00a5ff28}.name{font-size:70px;font-weight:800;line-height:1.18;margin:0 0 25px}.role{font-size:42px;line-height:1.3;margin:0}.instructor .head h1{font-size:51px}.instructor .claim{position:absolute;left:140px;right:140px;bottom:145px;background:#e9f5ff;border-radius:30px;padding:30px;font-size:40px;font-weight:700;text-align:center}.platform{background:#081b35}.platform-image{position:absolute;inset:0;width:1920px;height:1080px;object-fit:contain}.course-banner{position:absolute;left:0;right:0;top:0;height:154px;padding:12px 60px;background:#071b35;color:white;border-bottom:3px solid #ff6a24}.course-banner .tag{font-size:18px;letter-spacing:1px;color:#b9dfff;margin:0 0 7px}.course-banner h1{font-size:62px;line-height:1.1;margin:0 0 9px;font-weight:800}.course-banner em{color:#ff702b;font-style:normal}.course-banner .author{font-size:23px;margin:0;color:#e6f4ff;width:max-content}.counts{position:absolute;left:0;right:0;bottom:0;height:86px;display:grid;grid-template-columns:1fr 1fr 1.14fr;background:#071b35f8;border-top:2px solid #3281aa;align-items:center;color:white;padding:0 32px;gap:22px}.counts div{font-size:31px;font-weight:700;text-align:center;white-space:nowrap}.counts strong{color:#ff8a45;font-size:42px;margin-right:10px}'''
parts=['<!doctype html><meta charset="utf-8"><title>Claude Agent SDK · Readable app promo</title><style>'+style+'</style>']
for i,s in enumerate(shots):
 active=' active' if i==0 else ''
 if s['id']=='instructor':
  parts.append(f'<section class="shot instructor{active}" data-shot="{s["id"]}"><div class="head"><h1>Claude Agent SDK · Core Concepts &amp; Practice</h1><p>Welcome to the free course</p></div><div class="instructor-grid"><img class="portrait" src="author-photo.png"><div data-cue="welcome-1"><p class="name">Luis Coco Enriquez</p><p class="role">Creator of this free<br>Claude Agent SDK course</p></div></div><div class="claim">Practical examples. Real applications. Observable results.</div><div class="foot">YOUR INSTRUCTOR · CLAUDE AGENT SDK</div></section>')
 elif s['id']=='platform':
  parts.append(f'<section class="shot platform{active}" data-shot="platform"><img class="platform-image" src="learning-platform.png"><div class="course-banner"><p class="tag">SEPARATE UDEMY COURSE · CONCEPTS + PRACTICAL APPLICATIONS + LEARNING PLATFORM</p><h1 data-cue="next-0">Claude <em>Managed Agents</em></h1><p class="author" data-cue="next-4">By Luis Coco Enriquez · Explore the course on Udemy</p></div><div class="counts"><div data-cue="next-1"><strong>60</strong> concept lessons</div><div data-cue="next-2"><strong>60</strong> practical applications</div><div data-cue="next-3"><strong>75</strong> labs · learning platform</div></div></section>')
 else:
  f=focus[s['focus']];cx,cy,cw,ch=f['crop'];x,y,w,h=f['displayRect'];scale=w/cw;source=f'app-{f["sourceScene"]:02}.png'
  parts.append(f'<section class="shot{active}" data-shot="{s["id"]}"><div class="head"><h1 data-cue="{s["cues"][0]}">{s["heading"]}</h1><p>{s["sub"]}</p></div><div class="crop" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"><img src="{source}" style="width:{1920*scale}px;height:{1080*scale}px;left:{-cx*scale}px;top:{-cy*scale}px"></div><div class="foot">REAL APPLICATION · ENLARGED COMPLETE UI SECTION · EDITED FOR PROMO PACING</div></section>')
parts.append('<script>window.showShot=id=>document.querySelectorAll(".shot").forEach(s=>s.classList.toggle("active",s.dataset.shot===id));</script>')
(P/'promo-zoom.html').write_text('\n'.join(parts),encoding='utf8');(P/'visual-spec.json').write_text(json.dumps({'project':NAME,'durationSeconds':106,'retainedAudio':'videos/agent-sdk-udemy-promo-extended-v2/Claude-Agent-SDK-Udemy-Promo-Extended-v2.mp4','shots':shots,'focus':focus,'platformImage':'learning-platform.png','platformImageTreatment':'Original image remains unchanged; course title and counts are native HTML overlays.'},indent=2),encoding='utf8')
shutil.copy2(ROOT/'videos/agent-sdk-udemy-promo-extended-v2/narration-script.txt',OUT/'narration-script.txt')
print('Authored seven visual shots; all narration and timing retained.')
