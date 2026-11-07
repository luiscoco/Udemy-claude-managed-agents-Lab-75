"""Monitor this authorized batch and recover interrupted network jobs, boundedly."""
from pathlib import Path
import argparse,ctypes,json,runpy,subprocess,sys,time
from ctypes import wintypes
import requests
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'videos'
kernel=ctypes.WinDLL('kernel32',use_last_error=True)
kernel.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD];kernel.OpenProcess.restype=wintypes.HANDLE
kernel.GetExitCodeProcess.argtypes=[wintypes.HANDLE,ctypes.POINTER(wintypes.DWORD)];kernel.GetExitCodeProcess.restype=wintypes.BOOL
kernel.CloseHandle.argtypes=[wintypes.HANDLE]
def running(pid):
 handle=kernel.OpenProcess(0x1000,False,pid)
 if not handle:return False
 try:
  code=wintypes.DWORD();return bool(kernel.GetExitCodeProcess(handle,ctypes.byref(code))) and code.value==259
 finally:kernel.CloseHandle(handle)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--pid',type=int,required=True);a=parser.parse_args()
 state={'initialPid':a.pid,'state':'monitoring','recoveryPasses':[]};path=OUT/'supervisor-status.json'
 def save():path.write_text(json.dumps(state,indent=2))
 save()
 while running(a.pid):time.sleep(30)
 module=runpy.run_path(str(ROOT/'scripts/build-course-videos.py'))
 for attempt in range(2):
  data=json.loads((OUT/'production-status.json').read_text());pending=[]
  for item in data['labs']:
   if item['lab']<2 or module['validated'](item['lab']):continue
   error=item.get('error','')
   if any(s in error for s in ['SSLError','ConnectionError','Timeout','transport interrupted','Inworld HTTP 429']):pending.append(item['lab'])
  if not pending:break
  state['state']='checking_provider_connection';save();healthy=False
  for _ in range(60):
   try:
    response=requests.get('https://api.inworld.ai/tts/v1/voice',timeout=(10,10),allow_redirects=False)
    healthy=response.status_code not in (429,500,502,503,504);response.close()
   except requests.exceptions.RequestException:healthy=False
   if healthy:break
   time.sleep(60)
  if not healthy:state['state']='provider_connection_unavailable';save();return
  state['state']='recovering_interrupted_jobs';state['recoveryPasses'].append({'pass':attempt+1,'labs':pending});save()
  with (OUT/'recovery-production.log').open('a',encoding='utf8') as log:
   result=subprocess.run([sys.executable,'-u','scripts/build-course-videos.py','--labs',','.join(map(str,pending))],cwd=ROOT,stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
  state['recoveryPasses'][-1]['exitCode']=result.returncode;save()
 latest=json.loads((OUT/'production-status.json').read_text());module['STATES'].update({item['lab']:item for item in latest['labs']});module['refresh']();module['package']();module['refresh']()
 state['state']='complete' if all(module['validated'](n) for n in range(2,76)) else 'review_items_remain';save()
 print(state['state'],flush=True)
if __name__=='__main__':main()
