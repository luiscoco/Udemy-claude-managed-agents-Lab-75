"""Create editable promotional decks and narration plans from the user's curriculum."""
from pathlib import Path
import hashlib,json,sys
from pptx import Presentation
from pptx.util import Inches,Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from plan_lab_settings import SETTINGS

ROOT=Path(__file__).resolve().parents[1]
BLUE='087ED3';NAVY='112744';INK='10213B';PURPLE='8D43E9';GREEN='00A78C';MUTED='50657D';ORANGE='EC641C'

def build(extended=False):
 name='agent-sdk-free-course-promo'+('-extended' if extended else '')
 folder=ROOT/'presentations'/name;out=ROOT/'videos'/name
 (folder/'output').mkdir(parents=True,exist_ok=True);out.mkdir(parents=True,exist_ok=True)
 prs=Presentation();prs.slide_width=Inches(13.333333);prs.slide_height=Inches(7.5)
 rows=[];audit=[];script=[]
 def shape(s,x,y,w,h,fill,line=None,radius=True):
  sh=s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE,Inches(x),Inches(y),Inches(w),Inches(h));sh.fill.solid();sh.fill.fore_color.rgb=RGBColor.from_string(fill)
  sh.line.fill.background() if not line else None
  if line:sh.line.color.rgb=RGBColor.from_string(line)
  if radius:
   try:sh.adjustments[0]=.10
   except Exception:pass
  return sh
 def text(s,value,x,y,w,h,size=22,color=INK,bold=False):
  box=s.shapes.add_textbox(Inches(x),Inches(y),Inches(w),Inches(h));tf=box.text_frame;tf.word_wrap=True;tf.margin_left=0;tf.margin_right=0;tf.margin_top=0;tf.margin_bottom=0
  for i,line in enumerate(value.split('\n')):
   p=tf.paragraphs[0] if i==0 else tf.add_paragraph();p.text=line;p.font.name='Aptos';p.font.size=Pt(size);p.font.bold=bold;p.font.color.rgb=RGBColor.from_string(color);p.space_after=Pt(6)
  return [round(v*144) for v in (x,y,w,h)]
 def start(kicker,title):
  s=prs.slides.add_slide(prs.slide_layouts[6]);s.background.fill.solid();s.background.fill.fore_color.rgb=RGBColor(255,255,255)
  shape(s,9.3,0,4.03,7.5,'F3F9FE',radius=False);shape(s,.62,.50,.10,.25,BLUE,radius=False)
  text(s,kicker.upper(),.86,.48,11.8,.3,11,BLUE,True);text(s,title,.65,1.00,12.0,1.05,33,INK,True)
  shape(s,.65,6.83,12.0,.30,'E9F5FD',radius=False);text(s,'CLAUDE AGENT SDK  /  '+('SEPARATE COURSE IN DRAFT' if kicker.startswith('Separate course') else 'FREE COURSE'),.79,6.88,7,.18,8,NAVY,True)
  text(s,'LUIS COCO ENRIQUEZ',9.1,6.88,3.4,.18,8,MUTED)
  row={'slide':len(prs.slides),'segments':[]};rows.append(row);script.append('\n'+title)
  return s,row
 def cue(row,rect,visible,narration):
  cid=f"{row['slide']}-{len(row['segments'])+1}";target={'textRects':[rect],'paragraphGroups':[[0]]}
  row['segments'].append({'id':cid,'text':narration,'target':target});audit.append({'slide':row['slide'],'cue':cid,'narration':narration,'visibleText':[visible],'selectionPolicy':'Native slide text paragraph or complete card'});script.append(narration)
 def card(s,x,y,w,h,num,title,body,color,fill):
  shape(s,x,y,w,h,fill,'E2EAF2');shape(s,x+.22,y+.24,.50,.50,color)
  text(s,num,x+.31,y+.33,.36,.22,11,'FFFFFF',True)
  text(s,title,x+.23,y+1.02,w-.46,.82,21,color,True)
  text(s,body,x+.23,y+1.98,w-.46,h-2.1,18,INK)
  return [round(v*144) for v in (x+.18,y+.96,w-.36,h-1.13)]

 s,r=start('Claude Agent SDK · free Udemy course','Build your first\nClaude Agent SDK agent')
 text(s,'Start small. Understand what happens.\nTake control of your agent.',.67,3.0,8.6,1.15,24,MUTED)
 shape(s,9.55,2.13,2.85,3.85,'EDF5FF','DAE7F5')
 text(s,'FREE',9.83,2.45,2.3,.7,38,BLUE,True);text(s,'14 lectures\n2 sections',9.83,3.45,2.3,1.55,24,INK,True)
 a=text(s,'With Luis Coco Enriquez',.67,5.15,8.3,.6,23,NAVY,True)
 cue(r,[94,137,1210,245],'Build your first Claude Agent SDK agent','Ready to move from reading about AI agents to building your first one? Start with this free Claude Agent SDK course.')
 cue(r,a,'With Luis Coco Enriquez','Join Luis Coco Enriquez for a practical introduction, built around clear explanations and runnable examples.')

 s,r=start('Section 1 · learn by doing','From setup to your first result')
 for args,narr in [
  (('01','Install and configure','Prepare the project\nand your environment.',BLUE,'EFF7FF'),'Set up your project and environment, then run your first practical example.'),
  (('02','Invoke query()','Send a task.\nFollow the response.',PURPLE,'F5F0FF'),'Invoke query, send a task, and follow the agent\'s response.'),
  (('03','Inspect the result','Connect the output\nto the application flow.',GREEN,'EDFAF6'),'Connect what you see in the output to the application workflow.')]:
  x=.65+len(r['segments'])*4.12;rect=card(s,x,2.25,3.78,3.8,*args);cue(r,rect,args[1]+' '+args[2],narr)

 s,r=start('Section 1 · Claude Agent SDK fundamentals','Understand what happens inside the agent')
 for args,narr in [
  (('01','The agent loop','Follow the steps\nbehind a response.',BLUE,'EFF7FF'),'Understand how the agent loop works, step by step.'),
  (('02','Message types','Recognize the messages\nyour application receives.',PURPLE,'F5F0FF'),'Recognize agent message types and what they mean for your application.'),
  (('03','Context and\ncompaction','See how context is\nmanaged as work grows.',GREEN,'EDFAF6'),'Explore the context window and compaction through focused explanations and examples.')]:
  x=.65+len(r['segments'])*4.12;rect=card(s,x,2.25,3.78,3.8,*args);cue(r,rect,args[1]+' '+args[2],narr)

 s,r=start('Section 2 · configure and control','Make deliberate choices about execution')
 for args,narr in [
  (('01','Agent options','Configure the options\nobject with intent.',BLUE,'EFF7FF'),'Configure the agent options object with intent.'),
  (('02','Models and effort','Explore model, effort,\nand environment settings.',PURPLE,'F5F0FF'),'Explore models, effort, and environment settings.'),
  (('03','Turns and spending','Learn the controls\nthat bound a run.',GREEN,'EDFAF6'),'Learn how to limit turns and spending, so you can put boundaries around a run.')]:
  x=.65+len(r['segments'])*4.12;rect=card(s,x,2.25,3.78,3.8,*args);cue(r,rect,args[1]+' '+args[2],narr)

 s,r=start('A preview of the teaching style','See the application, workflow, and code together')
 preview=ROOT/'presentations/agent-sdk-free-course-promo/reference/slide-15.png'
 if not preview.exists():preview=next(preview.parent.glob('slide-15.*'))
 s.shapes.add_picture(str(preview),Inches(.65),Inches(2.16),width=Inches(8.0),height=Inches(4.5))
 shape(s,8.94,2.32,3.7,3.9,NAVY)
 a=text(s,'Concept\n↓\nPractical example\n↓\nApplication behavior',9.21,2.66,3.1,3.0,22,'FFFFFF',True)
 cue(r,a,'Concept → Practical example → Application behavior','Go beyond definitions. Connect each concept to a practical example and the behavior of the application.')

 s,r=start('Who this course is for','A focused starting point for developers')
 a=card(s,.65,2.23,5.75,3.8,'01','New to Claude Agent SDK?','Build a foundation before\nexploring larger agent systems.',BLUE,'EFF7FF')
 b=card(s,6.77,2.23,5.75,3.8,'02','Already comfortable with code?','Use the practical examples\nto connect ideas to implementation.',PURPLE,'F5F0FF')
 cue(r,a,'New to Claude Agent SDK? Build a foundation.','New to Claude Agent SDK? Build a foundation before taking on larger agent systems.')
 cue(r,b,'Comfortable with code? Connect ideas to implementation.','If you are comfortable reading code, these examples help connect the ideas to implementation.')

 if extended:
  s,r=start('Separate course · in development','Claude Agent SDK:\nBuild Autonomous AI Agents')
  for x,value,label,color,fill in [(0.65,'60','Concept lessons',BLUE,'EFF7FF'),(4.77,'75','Learning-platform labs',PURPLE,'F5F0FF'),(8.89,'45h 54m','Video uploaded so far',GREEN,'EDFAF6')]:
   shape(s,x,2.55,3.78,2.50,fill,'E2EAF2');text(s,value,x+.24,2.90,3.3,.70,38,color,True);text(s,label,x+.24,3.96,3.3,.65,19,INK,True)
  a=text(s,'A separate, longer course — currently in draft.',.70,5.48,11.8,.55,23,NAVY,True)
  cue(r,[94,137,1660,240],'Claude Agent SDK: Build Autonomous AI Agents','Luis is also developing a separate, longer course: Claude Agent SDK, Build Autonomous AI Agents.')
  cue(r,[126,416,478,225],'60 · Concept lessons','It includes sixty concept lessons.')
  cue(r,[719,416,478,225],'75 · Learning-platform labs','A learning platform with seventy-five labs.')
  cue(r,[1312,416,478,225],'45h 54m · Video uploaded so far','And forty-five hours and fifty-four minutes of video uploaded so far.')
  cue(r,a,'A separate, longer course — currently in draft.','That course is still in draft. Its content is separate from this free introduction.')

 s,r=start('Start with the fundamentals','Your first agent starts with one practical step')
 shape(s,.67,2.35,11.85,3.45,'EDF6FF','D9E9F9')
 a=text(s,'Enroll in the free course on Udemy',1.02,2.83,11.0,.85,34,BLUE,True)
 text(s,'Claude Agent SDK fundamentals\nPractical examples · Configuration · Execution controls',1.02,4.05,10.9,1.15,24,NAVY)
 cue(r,a,'Enroll in the free course on Udemy','Start with the free course on Udemy, and build your first Claude Agent SDK foundation.')
 deck=folder/'output'/('Claude-Agent-SDK-Free-Course-Promo'+('-Extended' if extended else '')+'.pptx');prs.save(deck)
 prefix='Claude-Agent-SDK-Free-Course-Promo'+('-Extended' if extended else '')
 plan={'project':name,'title':'Claude Agent SDK · Free Course Promo'+(' · Extended' if extended else ''),'displayTitle':'Claude Agent SDK - Free Course Promo','mediaPrefix':prefix,'presentation':deck.relative_to(ROOT).as_posix(),'presentationSha256':hashlib.sha256(deck.read_bytes()).hexdigest(),'outputFile':prefix+'.mp4','settings':SETTINGS,'resolution':[1920,1080],'fps':30,'transition':{'type':'perspective rotating cube','seconds':.8},'highlightAudit':'highlight-semantic-audit.json','verifyPhraseBoundaries':True,'slides':rows}
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2));(out/'narration-script.txt').write_text('\n'.join(script),encoding='utf8')
 (out/'editorial-notes.txt').write_text('Content based on the instructor-provided curriculum. No claim that the longer draft course is published. Its 60 concept lessons, 75 labs, and uploaded duration are separate from the free course.\nVisual reference: supplied SDK-Lesson01-App-Explained.pptx. Preview is from that supplied deck.\nFree course title is a descriptive label, not an invented official listing title. No course URL was supplied.\n'+('Extended version: for external marketing or the final Bonus Lecture. Disclose audiovisual promotion in the course description if using it within course content.\n' if extended else 'Landing-page version focuses only on this free course.\n')+'Udemy guidance: https://teach.udemy.com/publishing/promo-video/\nhttps://support.udemy.com/hc/en-us/sections/360001151954-Marketing-Tools\n',encoding='utf8')
 print(name,len(rows),'slides',sum(len(c['text'].split()) for row in rows for c in row['segments']),'words')

if __name__=='__main__':
 build();build(True)
