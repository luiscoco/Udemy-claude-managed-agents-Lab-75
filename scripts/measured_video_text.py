"""Resolve editorial highlight selections to exact OCR word spans."""
import re

def at(text,x,y):return (text,x,y)

def normalize(text):return re.sub(r'[^a-z0-9]','',text.lower())

class MeasuredVideoText:
 def __init__(self,ocr):self.ocr=ocr

 def locate(self,slide,selection):
  if isinstance(selection,tuple):query,px,py=selection
  else:query=selection;px=py=None
  needle=normalize(query);candidates=[]
  for line in self.ocr[slide-1]['lines']:
   words=line['words']
   for first in range(len(words)):
    for last in range(first+1,len(words)+1):
     selected=words[first:last];text=' '.join(w['text'] for w in selected)
     if needle not in normalize(text):continue
     x=min(w['rect'][0] for w in selected);y=min(w['rect'][1] for w in selected)
     right=max(w['rect'][0]+w['rect'][2] for w in selected);bottom=max(w['rect'][1]+w['rect'][3] for w in selected)
     distance=(x-px)**2+(y-py)**2 if px is not None else 0
     candidates.append(((len(normalize(text))-len(needle),distance,y),[x,y,right-x,bottom-y],text))
  assert candidates,('Missing measured phrase',slide,selection)
  _,rect,visible=min(candidates,key=lambda v:v[0]);return rect,visible

 def target(self,slide,selection):
  queries=selection if isinstance(selection,list) else [selection];found=[self.locate(slide,q) for q in queries]
  return {'textRects':[r for r,_ in found]},[v for _,v in found]
