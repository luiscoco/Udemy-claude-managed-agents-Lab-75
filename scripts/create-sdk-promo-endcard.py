"""Add a clearly separate Managed Agents course promotion to the approved trailer."""
from pathlib import Path
import ast,hashlib,json,shutil
from plan_lab_settings import SETTINGS
ROOT=Path(__file__).resolve().parents[1];NAME='agent-sdk-udemy-promo-extended-v2'
P=ROOT/'presentations'/NAME;V=ROOT/'videos'/NAME
P.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
shutil.copy2(ROOT/'presentations/agent-sdk-udemy-promo-88s-v1/astronaut.png',P/'astronaut.png')
tree=ast.parse((ROOT/'scripts/create-sdk-course-infographics.py').read_text(encoding='utf8'))
style=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='style' for t in n.targets))
extra='''h1{font-size:76px;margin-top:28px;letter-spacing:-2px}.tag{font-size:23px;font-weight:800;letter-spacing:1.6px;color:#087fff}.sub{font-size:32px;margin-top:26px}.astronaut{height:195px}.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:50px}.metric-card{border-radius:32px;border:1px solid #dce9f5;background:var(--fill);height:430px;padding:30px;text-align:center;display:flex;align-items:center;justify-content:center}.metric{width:100%}.metric strong{display:block;font-size:140px;line-height:1;color:var(--color);margin-bottom:24px}.metric h2{font-size:37px;line-height:1.18;margin:0 0 20px}.metric p{font-size:27px;line-height:1.32;margin:0}.next{position:absolute;left:64px;right:64px;bottom:116px;border-radius:30px;background:#e9f6ff;text-align:center;padding:27px}.next h2{font-size:38px;margin:0 0 13px;color:#087fff}.next p{font-size:28px;margin:0}.footer{font-size:19px}.page{font-size:20px}'''
extra+='.metric-card{align-items:flex-start;padding-top:58px}'
page='''<!doctype html><meta charset="utf-8"><title>Claude Managed Agents · Separate Udemy course</title><style>'''+style+extra+'''</style><section class="slide active"><img class="astronaut" src="astronaut.png"><div class="tag">ALSO BY LUIS COCO ENRIQUEZ · SEPARATE UDEMY COURSE</div><h1 data-cue="next-0">Claude <em>Managed Agents</em></h1><p class="sub">Continue your learning with concepts, practical applications, and labs.</p><div class="metrics">
<article class="metric-card" style="--color:#087fff;--fill:#eff8ff"><div class="metric" data-cue="next-1"><strong>60</strong><h2>Concept lessons</h2><p>Build your understanding<br>of Claude Managed Agents.</p></div></article>
<article class="metric-card" style="--color:#00a977;--fill:#edfbf5"><div class="metric" data-cue="next-2"><strong>60</strong><h2>Practical example<br>applications</h2><p>Connect concepts<br>to working applications.</p></div></article>
<article class="metric-card" style="--color:#8838ff;--fill:#f6f1ff"><div class="metric" data-cue="next-3"><strong>75</strong><h2>Hands-on labs</h2><p>Explore the included<br>learning platform.</p></div></article>
</div><div class="next" data-cue="next-4"><h2>Explore Claude Managed Agents on Udemy</h2><p>A separate course by Luis Coco Enriquez</p></div><footer class="footer">CLAUDE MANAGED AGENTS · CONCEPTS + APPLICATIONS + LEARNING PLATFORM</footer><span class="page">CONTINUE LEARNING</span></section>'''
(P/'endcard.html').write_text(page,encoding='utf8')
narration=[('next-0','Continue your learning with the separate Udemy course, Claude Managed Agents:'),('next-1','sixty concept lessons,'),('next-2','sixty practical example applications,'),('next-3','and a learning platform with seventy-five labs.'),('next-4','Explore this course by Luis Coco Enriquez.')]
(P/'endcard-spec.json').write_text(json.dumps({'title':'Claude Managed Agents','conceptLessons':60,'practicalApplications':60,'platformLabs':75,'claimsSource':'Instructor request and supplied screenshot for course title','courseRelationship':'Separate Udemy course; not part of the free SDK course','publicCourseUrl':None,'originalPromoSeconds':88,'appendSeconds':18,'totalSeconds':106,'segments':narration},indent=2),encoding='utf8')
(V/'narration-script.txt').write_text((ROOT/'videos/agent-sdk-udemy-promo-88s-v1/narration-script.txt').read_text(encoding='utf8')+'\n\n88–106s · Separate course promotion\n'+' '.join(t for _,t in narration),encoding='utf8')
(V/'editorial-notes.txt').write_text('The approved 88-second trailer is retained and followed by an 18-second narrated end slide. Counts and separate-course name come from the instructor. No public course URL was supplied; the private instructor-management URL is not displayed. The slide promotes the separate Claude Managed Agents course and does not imply these resources are included in the free Claude Agent SDK course. Availability is not independently asserted; the supplied screenshot includes a Draft label. Existing voice and visual style are retained.\n',encoding='utf8')
geometry=P/'.build/video/slides/geometry.json'
if geometry.exists():
 g=json.loads(geometry.read_text(encoding='utf8'))[0];segments=[];audit=[]
 for cid,text in narration:
  b=next(b for b in g['rects'] if b['id']==cid);target={'textRects':[b['rect']],'paragraphGroups':[[0]]};segments.append({'id':cid,'text':text,'target':target});audit.append({'cue':cid,'narration':text,'visibleText':[b['text']]})
 source=P/'endcard.html';plan={'project':NAME,'title':'Claude Agent SDK Promo · Extended','mediaPrefix':'Claude-Agent-SDK-Udemy-Promo-Extended-v2','outputFile':'Claude-Agent-SDK-Udemy-Promo-Extended-v2.mp4','presentation':source.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'settings':SETTINGS,'slides':[{'slide':1,'segments':segments}]}
 (V/'narration-plan.json').write_text(json.dumps(plan,indent=2));(V/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2))
 print('Prepared narrated course end card.')
else:print('Authored separate-course end card.')
