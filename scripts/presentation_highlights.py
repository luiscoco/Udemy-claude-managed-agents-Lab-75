"""Shared video highlight layout: fit visible text, never its enclosing shape."""
import math
import cv2
import numpy as np
cv2.setNumThreads(2)

PADDING=8

def raster_blocks(mask,left,top):
 # Split unrelated UI labels before joining contiguous lines of a paragraph.
 rows=np.flatnonzero(np.any(mask,axis=1));bands=np.split(rows,np.where(np.diff(rows)>4)[0]+1);lines=[]
 for band in bands:
  if not len(band):continue
  y0,y1=int(band[0]),int(band[-1])+1;columns=np.flatnonzero(np.any(mask[y0:y1],axis=0))
  for part in np.split(columns,np.where(np.diff(columns)>max(28,(y1-y0)*1.6))[0]+1):
   if not len(part):continue
   x0,x1=int(part[0]),int(part[-1])+1
   if x1-x0>=35 and y1-y0>=12:lines.append([left+x0,top+y0,x1-x0,y1-y0])
 blocks=[]
 for line in lines:
  x,y,w,h=line;match=None
  for block in reversed(blocks):
   bx,by,bw,bh=block;gap=y-by-bh;overlap=min(x+w,bx+bw)-max(x,bx)
   if 0<=gap<=h*.8 and abs(x-bx)<30 and overlap>=min(w,bw)*.5:match=block;break
  if match is None:blocks.append(line)
  else:match[:]=combine([match,line])
 assert blocks,'No raster text blocks found'
 return blocks

def crop(image,rect):
 x,y,w,h=rect;left=max(0,math.floor(x));top=max(0,math.floor(y));right=min(image.shape[1],math.ceil(x+w));bottom=min(image.shape[0],math.ceil(y+h))
 assert right>left and bottom>top,rect
 return image[top:bottom,left:right],left,top

def ink_bounds(image,rect,raster=False):
 region,left,top=crop(image,rect)
 if raster:
  gray=cv2.cvtColor(region,cv2.COLOR_BGR2GRAY)
  kernel=cv2.getStructuringElement(cv2.MORPH_RECT,(41,41))
  keep=np.zeros(gray.shape,np.uint8)
  for operation in [cv2.MORPH_BLACKHAT,cv2.MORPH_TOPHAT]:
   mask=np.uint8(cv2.morphologyEx(gray,operation,kernel)>45)*255
   count,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)
   for i in range(1,count):
    x,y,w,h,area=stats[i]
    # Process light/dark lettering separately so nearby panel backgrounds cannot
    # join the characters into one large component.
    if 2<=w<=140 and 7<=h<=85 and area>=9 and area/(w*h)>.07:keep[labels==i]=255
  mask=keep
 else:
  # Native paragraph bounds constrain the search to the actual text. Resolve the
  # surrounding flat fill from the most common colour, including dark panels.
  pixels=region.reshape(-1,3);quantized=pixels.astype(np.int32)//8
  keys=quantized[:,0]*1024+quantized[:,1]*32+quantized[:,2]
  dominant=int(np.argmax(np.bincount(keys,minlength=32768)))
  background=np.median(pixels[keys==dominant],axis=0)
  mask=np.uint8(np.max(np.abs(region.astype(float)-background),axis=2)>24)*255
 points=cv2.findNonZero(mask)
 assert points is not None,('No visible text found; review target instead of highlighting an empty shape',rect)
 if raster:return raster_blocks(mask,left,top)
 x,y,w,h=cv2.boundingRect(points)
 return [left+x,top+y,w,h]

def combine(rects):
 left=min(r[0] for r in rects);top=min(r[1] for r in rects)
 return [left,top,max(r[0]+r[2] for r in rects)-left,max(r[1]+r[3] for r in rects)-top]

def fit_highlights(target,geometry,image):
 if 'textRects' in target:
  # OCR supplies measured screenshot text, already separated from UI chrome.
  inks=[ink_bounds(image,r) for r in target['textRects']]
  if 'paragraphGroups' in target:
   groups=target['paragraphGroups']
   assert sorted(i for group in groups for i in group)==list(range(len(inks)))
   inks=[combine([inks[i] for i in group]) for group in groups]
 elif 'rect' in target:
  inks=ink_bounds(image,target['rect'],raster=True)
  if target.get('textBlock'):inks=[combine(inks)]
 else:
  inks=[]
  for index in target.get('shapes',[target.get('shape')]):
   item=geometry['shapes'][index]
   paragraphs=[item['paragraphs'][target['paragraph']]] if 'paragraph' in target else item['paragraphs']
   text=[p for p in paragraphs if p['text'].strip()]
   assert text,('A text target must have measured paragraphs',index,item['name'])
   # Separate labels/cards get separate outlines; never join them across blank space.
   inks.append(combine([ink_bounds(image,p['rect']) for p in text]))
 result=[]
 for ink in inks:
  x,y,w,h=ink;left=max(4,x-PADDING);top=max(4,y-PADDING);right=min(image.shape[1]-4,x+w+PADDING);bottom=min(image.shape[0]-4,y+h+PADDING)
  result.append({'rect':[left,top,right-left,bottom-top],'textInkRect':ink,'padding':PADDING})
 return result
