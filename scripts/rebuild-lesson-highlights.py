"""Finish all four requested visual-only revisions and publish only verified files."""
from pathlib import Path
import json,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
PROJECTS=['lesson01-overview-setup','lesson02-agents-versions','lesson03-environments','lesson04-sessions']

def main():
 status=ROOT/'videos/lesson-highlights-revision-status.json';done=[]
 for project in PROJECTS:
  print('Reviewing paragraph layout:',project,flush=True)
  subprocess.run([sys.executable,'-u',str(ROOT/'scripts/review-presentation-highlights.py'),'--project',project,'--plan'],cwd=ROOT,check=True)
 for project in PROJECTS:
  status.write_text(json.dumps({'active':project,'completed':done},indent=2))
  print('Rebuilding with original audio:',project,flush=True)
  subprocess.run([sys.executable,'-u',str(ROOT/'scripts/build-narrated-presentation.py'),'--project',project,'--visual-only'],cwd=ROOT,check=True)
  report=json.loads((ROOT/'videos'/project/'highlight-revision-validation.json').read_text())
  assert report['originalAudioPreserved'] and report['audioPacketHashBefore']==report['audioPacketHashAfter']
  done.append(project)
 status.write_text(json.dumps({'active':None,'completed':done,'stage':'complete'},indent=2))
 print('All four paragraph-highlight revisions verified and published.',flush=True)

if __name__=='__main__':main()
