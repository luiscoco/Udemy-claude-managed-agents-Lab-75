"""Offline visual revision: complete local paragraphs, unchanged provider audio."""
from pathlib import Path
import argparse,copy,hashlib,importlib.util,json,re,shutil
import cv2,numpy as np

ROOT=Path(__file__).resolve().parents[1]
PROJECTS=['lesson01-overview-setup','lesson02-agents-versions','lesson03-environments','lesson04-sessions']
# Editorial corrections for introductory phrases whose original keyword also
# appears in another panel. Keep the explanation in its intended local section.
SAME_PASSAGE={('lesson04-sessions','2-4'):'2-2',('lesson03-environments','2-13'):'2-14'}

def bounds(words):
 x=min(w['rect'][0] for w in words);y=min(w['rect'][1] for w in words)
 return [x,y,max(w['rect'][0]+w['rect'][2] for w in words)-x,max(w['rect'][1]+w['rect'][3] for w in words)-y]

def intersection(a,b):
 x,y,w,h=a;u,v,p,q=b
 return max(0,min(x+w,u+p)-max(x,u))*max(0,min(y+h,v+q)-max(y,v))

def lines_for(slide,image):
 lines=[]
 for row in slide['lines']:
  parts=[];part=[]
  for word in row['words']:
   if part and word['rect'][0]-part[-1]['rect'][0]-part[-1]['rect'][2]>max(32,np.median([w['rect'][3] for w in part])*2):
    parts.append(part);part=[]
   part.append(word)
  if part:parts.append(part)
  for words in parts:
   rect=bounds(words);x,y,w,h=map(int,rect)
   # A dark enclosing panel identifies code, without interpreting its contents.
   region=image[max(0,y-5):min(1080,y+h+5),max(0,x-5):min(1920,x+w+5)]
   dark=float((region.max(axis=2)<110).mean())>.52
   marker=image[max(0,y-2):min(1080,y+h+2),max(0,x-43):max(0,x-3)]
   bullet=False
   if marker.size and not dark:
    hsv=cv2.cvtColor(marker,cv2.COLOR_BGR2HSV);mask=np.uint8((hsv[:,:,1]>110)&(hsv[:,:,2]>110))*255
    count,_,stats,_=cv2.connectedComponentsWithStats(mask)
    bullet=any(4<=a[2]<=20 and 4<=a[3]<=20 and .6<a[2]/a[3]<1.65 and a[4]>=18 for a in stats[1:])
   text=' '.join(w['text'] for w in words)
   explicit_bullet=text.lstrip().startswith(('\u2022','\u25cf','\u25aa','\u25e6'))
   bullet=explicit_bullet or (bullet and bool(text) and (text[0].isupper() or text[0].isdigit()))
   lines.append({'rect':rect,'text':text,'font':float(np.median([w['rect'][3] for w in words])),'code':dark,'boundary':bullet})
 for a in lines:
  if a['code']:continue
  x,y,w,h=a['rect']
  below=[b for b in lines if b is not a and not b['code'] and abs(b['rect'][0]-x)<25 and 0<=b['rect'][1]-y-h<=max(15,h*.9)]
  if below:
   b=min(below,key=lambda b:b['rect'][1])
   if a['text'][0].isupper() and not a['text'].endswith(('.',',',';')) and a['font']>b['font']*1.06 and w<b['rect'][2]*.85:a['boundary']=True
 return lines

def paragraph(seed,lines):
 base=lines[seed];selected={seed}
 if base['code']:return selected
 # A paragraph must remain local: no crossing columns, cards, or headings.
 for _ in range(12):
  choices=[]
  for i,a in enumerate(lines):
   if i in selected or a['code'] or a['font']<base['font']*.70 or a['font']>base['font']*1.45:continue
   x,y,w,h=a['rect']
   if h>base['rect'][3]*1.55:continue
   for j in selected:
    b=lines[j];u,v,p,q=b['rect'];gap=max(y,v)-min(y+h,v+q)
    overlap=min(x+w,u+p)-max(x,u)
    lower=a if y>v else b;upper=b if y>v else a
    if lower['boundary']:continue
    if gap>3 and upper['text'].rstrip().endswith('.') and lower['text'][0].isupper():continue
    if -2<=gap<=max(7,min(h,q)*.82) and abs(x-u)<=max(24,base['font']*1.35) and overlap>min(w,p)*.4:
     combined=bounds([{'rect':lines[k]['rect']} for k in selected|{i}])
     if combined[3]<=max(300,base['font']*12) and combined[2]<1050:choices.append((gap,i))
  if not choices:break
  selected.add(min(choices)[1])
 return selected

def expand(target,lines):
 sets=[]
 for rect in target['textRects']:
  candidates=[(intersection(rect,l['rect'])/max(1,rect[2]*rect[3]),-abs(rect[1]-l['rect'][1]),i) for i,l in enumerate(lines)]
  score,_,seed=max(candidates);assert score>.2,(rect,score)
  group=paragraph(seed,lines)
  for old in sets:
   if group&old:old.update(group);break
  else:sets.append(group)
 # Coalesce overlapping selections after all seeds are expanded.
 changed=True
 while changed:
  changed=False
  for i in range(len(sets)):
   for j in range(i+1,len(sets)):
    if sets[i]&sets[j]:sets[i]|=sets.pop(j);changed=True;break
   if changed:break
 sets.sort(key=lambda g:min((lines[k]['rect'][1],lines[k]['rect'][0]) for k in g))
 rects=[];groups=[];visible=[]
 for group in sets:
  indices=sorted(group,key=lambda k:(lines[k]['rect'][1],lines[k]['rect'][0]));start=len(rects)
  rects.extend(lines[k]['rect'] for k in indices);groups.append(list(range(start,len(rects))))
  visible.append(' '.join(lines[k]['text'] for k in indices))
 return {'textRects':rects,'paragraphGroups':groups},visible

def revise(name):
 out=ROOT/'videos'/name
 backup=out/('before-paragraph-revision' if name=='managed-agents-v1.3.0' else 'before-highlight-revision');backup.mkdir(exist_ok=True)
 for f in ['narration-plan.json','recording-manifest.json','timeline.json','highlight-semantic-audit.json','validation.json']:
  if not (backup/f).exists():shutil.copy2(out/f,backup/f)
 original=json.loads((backup/'narration-plan.json').read_text());movie=out/original['outputFile']
 if not (backup/movie.name).exists():shutil.copy2(movie,backup/movie.name)
 plan=copy.deepcopy(original);manifest=json.loads((backup/'recording-manifest.json').read_text())
 ocr=json.loads((ROOT/'presentations'/name/'.build/video/slides/ocr.json').read_text(encoding='utf-8-sig'))
 spec=importlib.util.spec_from_file_location('recorder',ROOT/'scripts/record-presentation-video.py');recorder=importlib.util.module_from_spec(spec);spec.loader.exec_module(recorder)
 audit=[];stats=[]
 for row,record in zip(plan['slides'],manifest['recordings']):
  n=row['slide'];image=cv2.imread(str(ROOT/'presentations'/name/f'.build/video/slides/slide-{n:02}.png'));lines=lines_for(ocr[n-1],image)
  segments=[];proofs=[];old_count=len(row['segments'])
  originals={s['id']:s for s in row['segments']}
  for segment in row['segments']:
   source=originals[SAME_PASSAGE[(name,segment['id'])]] if (name,segment['id']) in SAME_PASSAGE else segment
   target,visible=expand(source['target'],lines);segment=copy.deepcopy(segment);segment['target']=target
   if segments and segments[-1]['target']==target:
    segments[-1]['text']+=' '+segment['text'];proofs[-1]['narration']=segments[-1]['text'];proofs[-1]['originalCueIds'].append(segment['id'])
   else:
    segments.append(segment);proofs.append({'slide':n,'cue':segment['id'],'narration':segment['text'],'visibleText':visible,'originalCueIds':[segment['id']],'selectionPolicy':'Complete local paragraph or complete code line; no adjacent columns'})
  assert ' '.join(s['text'] for s in row['segments'])==' '.join(s['text'] for s in segments)
  row['segments']=segments;metadata=json.loads((ROOT/record['audio']).with_suffix('.json').read_text())
  record['cues']=recorder.align(segments,metadata['timestampInfo']);audit.extend(proofs)
  assert hashlib.sha256((ROOT/record['audio']).read_bytes()).hexdigest()==record['sha256']
  stats.append({'slide':n,'originalCues':old_count,'revisedCues':len(segments)})
 plan['retainedAudioSource']=(backup/movie.name).relative_to(ROOT).as_posix();plan['highlightRevision']='Paragraph and statement targets with continuous explanations';plan['verifyPhraseBoundaries']=True
 (out/'narration-plan.json').write_text(json.dumps(plan,indent=2));(out/'recording-manifest.json').write_text(json.dumps(manifest,indent=2));(out/'highlight-semantic-audit.json').write_text(json.dumps(audit,indent=2))
 (out/'paragraph-revision-audit.json').write_text(json.dumps({'project':name,'slides':stats,'originalNarrationUnchanged':True,'sourceAudioHashesUnchanged':True},indent=2))
 print(name, sum(s['originalCues'] for s in stats),'->',sum(s['revisedCues'] for s in stats),'continuous paragraph cues',flush=True)

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--project',choices=PROJECTS+['managed-agents-v1.3.0']);args=p.parse_args()
 for name in [args.project] if args.project else PROJECTS:revise(name)
