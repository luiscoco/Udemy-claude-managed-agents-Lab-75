"""Bounded, resumable Inworld recording for an authored presentation plan."""
from pathlib import Path
import argparse,base64,hashlib,json,re,subprocess,time,unicodedata,wave,tempfile,os
from contextlib import contextmanager
import requests,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'videos/lab01'
CACHE=ROOT/'presentations/lab01/.build/video/audio'
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
SESSION=requests.Session()

def temporary_file(parent,suffix):
 with tempfile.NamedTemporaryFile(dir=parent,prefix='.record-',suffix=suffix,delete=False) as handle:
  return Path(handle.name)

def atomic_json(path,payload):
 staged=temporary_file(path.parent,'.json')
 try:
  staged.write_text(json.dumps(payload,indent=2),encoding='utf-8');staged.replace(path)
 finally:staged.unlink(missing_ok=True)

@contextmanager
def recording_lock(directory):
 # OS-backed locks are released on process exit, including a crashed recorder.
 # Keep the lock file in place so a second process cannot lock a different inode.
 with (directory/'.recording.lock').open('a+b') as handle:
  if handle.tell()==0:handle.write(b'0');handle.flush()
  handle.seek(0)
  try:
   if os.name=='nt':
    import msvcrt
    msvcrt.locking(handle.fileno(),msvcrt.LK_NBLCK,1)
   else:
    import fcntl
    fcntl.flock(handle.fileno(),fcntl.LOCK_EX|fcntl.LOCK_NB)
  except OSError as error:raise RuntimeError(f'Another recorder is already using {directory}') from error
  try:yield
  finally:
   handle.seek(0)
   if os.name=='nt':msvcrt.locking(handle.fileno(),msvcrt.LK_UNLCK,1)
   else:fcntl.flock(handle.fileno(),fcntl.LOCK_UN)

def validate_timing(cues,duration):
 assert cues and cues[-1]['end']<=duration+.25, f'Word timing ends at {cues[-1]["end"] if cues else "unknown"}s but decoded audio is {duration:.3f}s; cached audio must be rebuilt'

def tokens(text):return re.findall(r'[^\W_]+',unicodedata.normalize('NFKC',text).lower())

def align(segments,info):
 a=info['wordAlignment'];words=a['words'];starts=a['wordStartTimeSeconds'];ends=a['wordEndTimeSeconds']
 assert len(words)==len(starts)==len(ends)
 actual=[]
 for i,w in enumerate(words):
  assert 0<=starts[i]<=ends[i] and (i==0 or starts[i]>=starts[i-1])
  actual.extend((t,starts[i],ends[i]) for t in tokens(w))
 expected=[w for s in segments for w in tokens(s['text'])]
 assert [x[0] for x in actual]==expected,'Provider words differ from exact narration; preserve cache and review.'
 offset=0;cues=[]
 for s in segments:
  n=len(tokens(s['text']));start=actual[offset][1];end=actual[offset+n-1][2]
  assert end>start and (not cues or start>=cues[-1]['end']-.02)
  cues.append({'id':s['id'],'start':start,'end':end,'text':s['text'],'target':s['target']});offset+=n
 return cues

def decode(path):
 result=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-f','s16le','-ac','1','-ar','48000','pipe:1'],capture_output=True)
 assert result.returncode==0 and not result.stderr,result.stderr.decode(errors='replace')[:500]
 return len(result.stdout)/(48000*2)

def request_audio(text,settings,env):
 global SESSION
 body={**settings,'text':text};assert len(text)<2000 and 'language' not in body
 key=hashlib.sha256(json.dumps(body,sort_keys=True).encode()).hexdigest();audio=CACHE/f'{key}.mp3';metadata=CACHE/f'{key}.json'
 reused=audio.exists() and metadata.exists()
 if reused:return audio,json.loads(metadata.read_text()),True
 transport_retries=0;rate_retries=0
 while True:
  try:response=SESSION.post('https://api.inworld.ai/tts/v1/voice',headers={'Authorization':'Basic '+env['INWORLD_API_KEY'],'Content-Type':'application/json'},json=body,timeout=(15,120),allow_redirects=False)
  except (requests.exceptions.ConnectionError,requests.exceptions.Timeout) as error:
   if transport_retries:raise RuntimeError('Inworld transport interrupted twice; cached audio preserved; manual review required.') from error
   transport_retries+=1
   # A connection failure has uncertain provider billing. Record the one bounded
   # retry explicitly; never loop indefinitely or repeat completed recordings.
   (CACHE/f'{key}.transport-retry.json').write_text(json.dumps({'requestSha256':key,'reason':type(error).__name__,'retryCount':1,'providerBilling':'unknown for interrupted request'},indent=2))
   SESSION.close();SESSION=requests.Session()
   time.sleep(2);continue
  if response.status_code==429 and rate_retries<2:
   rate_retries+=1;delay=min(30,max(2,float(response.headers.get('Retry-After','5'))));response.close();time.sleep(delay);continue
  break
 if response.status_code!=200:raise RuntimeError(f'Inworld HTTP {response.status_code}; recording stopped without automatic retries.')
 payload=response.json();data=base64.b64decode(payload.pop('audioContent'),validate=True)
 assert 1000<len(data)<10*1024*1024
 staged=temporary_file(CACHE,'.mp3')
 try:
  staged.write_bytes(data);decode(staged);staged.replace(audio);atomic_json(metadata,payload)
 finally:staged.unlink(missing_ok=True)
 return audio,payload,False

def slide_audio(row,settings,env):
 text=' '.join(s['text'] for s in row['segments']);key=hashlib.sha256(json.dumps({**settings,'text':text},sort_keys=True).encode()).hexdigest()
 for prefix in ['merged-','']:
  audio=CACHE/f'{prefix}{key}.mp3';meta=CACHE/f'{prefix}{key}.json'
  if audio.exists() and meta.exists():
   payload=json.loads(meta.read_text())
   try:
    cues=align(row['segments'],payload['timestampInfo']);duration=decode(audio);validate_timing(cues,duration)
    return audio,cues,duration,True
   except (AssertionError,KeyError):pass
 if len(text)<=350:
  audio,payload,reused=request_audio(text,settings,env)
  try:
   cues=align(row['segments'],payload['timestampInfo']);duration=decode(audio);validate_timing(cues,duration)
   return audio,cues,duration,reused
  except AssertionError:
   if len(row['segments'])<2:raise
 # Keep long diagrams below a single long synthesis window. Every subrequest has
 # its own verified provider word alignment; offsets come from decoded samples.
 chunks=[];current=[];pieces=[];cap=350
 for segment in row['segments']:
  if len(segment['text'])<=cap:pieces.append(segment);continue
  part=[];index=0
  for word in segment['text'].split():
   if part and len(' '.join(part))+len(word)+1>cap:
    pieces.append({**segment,'id':segment['id']+f'-part{index}','text':' '.join(part)});part=[];index+=1
   part.append(word)
  if part:pieces.append({**segment,'id':segment['id']+f'-part{index}','text':' '.join(part)})
 for segment in pieces:
  if current and sum(len(s['text'])+1 for s in current)+len(segment['text'])>cap:chunks.append(current);current=[]
  current.append(segment)
 if current:chunks.append(current)
 assert len(chunks)>1,'Invalid provider timing requires a smaller reviewed request'
 pcm_parts=[];words=[];starts=[];ends=[];offset=0;source=[];all_reused=True
 for chunk in chunks:
  audio,payload,reused=request_audio(' '.join(s['text'] for s in chunk),settings,env);align(chunk,payload['timestampInfo']);all_reused&=reused
  decoded=subprocess.run([FFMPEG,'-v','error','-i',str(audio),'-f','s16le','-ac','1','-ar','48000','pipe:1'],capture_output=True);assert decoded.returncode==0 and not decoded.stderr
  alignment=payload['timestampInfo']['wordAlignment']
  chunk_duration=len(decoded.stdout)/96000
  validate_timing(align(chunk,payload['timestampInfo']),chunk_duration)
  words.extend(alignment['words']);starts.extend(t+offset for t in alignment['wordStartTimeSeconds']);ends.extend(t+offset for t in alignment['wordEndTimeSeconds'])
  pcm_parts.append(decoded.stdout);offset+=len(decoded.stdout)/96000;source.append(audio.name)
 merged=CACHE/f'merged-{key}.mp3';wav=temporary_file(CACHE,'.wav');staged=temporary_file(CACHE,'.mp3')
 try:
  with wave.open(str(wav),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000);w.writeframes(b''.join(pcm_parts))
  encoded=subprocess.run([FFMPEG,'-v','error','-y','-i',str(wav),'-c:a','libmp3lame','-b:a','192k',str(staged)],capture_output=True)
  assert encoded.returncode==0 and not encoded.stderr,encoded.stderr.decode(errors='replace')[-1000:]
  payload={'joinedFrom':source,'timestampInfo':{'wordAlignment':{'words':words,'wordStartTimeSeconds':starts,'wordEndTimeSeconds':ends}}};cues=align(row['segments'],payload['timestampInfo'])
  duration=decode(staged);validate_timing(cues,duration)
  assert abs(duration-offset)<.1,f'Merged audio duration {duration:.3f}s differs from source PCM {offset:.3f}s'
  staged.replace(merged);atomic_json(CACHE/f'merged-{key}.json',payload)
  return merged,cues,duration,all_reused
 finally:
  wav.unlink(missing_ok=True);staged.unlink(missing_ok=True)

def main():
 global OUT,CACHE
 args=argparse.ArgumentParser();args.add_argument('--lab',type=int,default=1);args.add_argument('--project');args.add_argument('--limit',type=int);args.add_argument('--execute-authorized-recording',action='store_true');a=args.parse_args()
 assert a.execute_authorized_recording and 1<=a.lab<=75
 OUT=ROOT/f'videos/lab{a.lab:02}';CACHE=ROOT/f'presentations/lab{a.lab:02}/.build/video/audio'
 if a.project:
  assert re.fullmatch(r'[a-z0-9][a-z0-9.-]*',a.project)
  OUT=ROOT/'videos'/a.project;CACHE=ROOT/'presentations'/a.project/'.build/video/audio'
 env={}
 for line in (ROOT/'.env').read_text().splitlines():
  if '=' in line and not line.lstrip().startswith('#'):
   k,v=line.split('=',1);env[k.strip()]=v.strip().strip('"\'')
 assert env.get('INWORLD_API_KEY') and env.get('INWORLD_NARRATION_ENABLED')=='1'
 plan=json.loads((OUT/'narration-plan.json').read_text());CACHE.mkdir(parents=True,exist_ok=True);records=[]
 limit=a.limit or len(plan['slides']);assert 1<=limit<=len(plan['slides'])
 with recording_lock(CACHE):
  for row in plan['slides'][:limit]:
   audio,cues,duration,reused=slide_audio(row,plan['settings'],env)
   validate_timing(cues,duration)
   records.append({'slide':row['slide'],'audio':audio.relative_to(ROOT).as_posix(),'sha256':hashlib.sha256(audio.read_bytes()).hexdigest(),'duration':duration,'timingSource':'inworld-word','cues':cues,'settings':plan['settings']})
   atomic_json(OUT/'recording-manifest.json',{'presentationSha256':plan['presentationSha256'],'recordings':records})
   print(f"Slide {row['slide']:02}: {'reused' if reused else 'recorded'}; {duration:.2f}s; {len(cues)} word-aligned highlights.",flush=True)
if __name__=='__main__':main()
