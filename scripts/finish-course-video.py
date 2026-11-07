"""Finish a single reviewed/resumable lesson without duplicating batch jobs."""
from pathlib import Path
import argparse,runpy,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--lab',type=int,required=True);parser.add_argument('--replan',action='store_true');a=parser.parse_args();assert 2<=a.lab<=75
 commands=[]
 if a.replan:commands.append([sys.executable,'scripts/plan-course-videos.py','--lab',str(a.lab)])
 commands.extend([[sys.executable,'scripts/review-presentation-highlights.py','--lab',str(a.lab),'--plan'],[sys.executable,'scripts/record-presentation-video.py','--lab',str(a.lab),'--execute-authorized-recording'],[sys.executable,'scripts/render-presentation-video.py','--lab',str(a.lab)],[sys.executable,'scripts/verify-presentation-video.py','--lab',str(a.lab)]])
 for command in commands:subprocess.run(command,cwd=ROOT,check=True,creationflags=subprocess.CREATE_NO_WINDOW)
 runpy.run_path(str(ROOT/'scripts/build-course-videos.py'))['publish'](a.lab)
 print(f'Lab {a.lab:02} finished and published locally.',flush=True)
if __name__=='__main__':main()
