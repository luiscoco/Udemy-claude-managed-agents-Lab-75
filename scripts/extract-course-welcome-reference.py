from pathlib import Path
import cv2,numpy as np,json
R=Path(__file__).resolve().parents[1];A=R/'presentations/agent-sdk-course-welcome/assets';file=R/'videos/agent-sdk-bonus-course/Claude-Agent-SDK-Bonus-Lecture.mp4'
cap=cv2.VideoCapture(str(file));panels=[]
for t in [65,90,115,140,165,185]:
 cap.set(cv2.CAP_PROP_POS_MSEC,t*1000);ok,im=cap.read();assert ok
 cv2.imwrite(str(A/f'reference-{t}.png'),im);thumb=cv2.resize(im,(640,360));cv2.putText(thumb,str(t),(20,340),0,1,(0,0,255),2);panels.append(thumb)
cv2.imwrite(str(A/'reference-contact.jpg'),np.vstack([np.hstack(panels[:2]),np.hstack(panels[2:4]),np.hstack(panels[4:])]))
cap.release();print('Extracted six candidate frames from the previously produced SDK platform tour.')
source=cv2.imread(str(A/'reference-65.png'));native=source[145:1000,75:1845]
cv2.imwrite(str(A/'platform-lesson.png'),native)
(A/'lesson-reference.json').write_text(json.dumps({'source':file.relative_to(R).as_posix(),'sourceTimestampSeconds':65,'crop':[75,145,1770,855],'purpose':'Extract the real browser area from the previously produced platform walkthrough, preserving the visible lesson tabs and guide.','liveExecutionClaimed':False},indent=2),encoding='utf-8')
