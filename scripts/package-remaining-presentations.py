"""Validate source links and required slide structure, then package Labs 23–75."""
from pathlib import Path
import hashlib, html, json, zipfile
from pptx import Presentation

ROOT=Path(__file__).resolve().parents[1]
rows=[]
for n in range(23,76):
    folder=ROOT/f'presentations/lab{n}'
    files=list((folder/'output').glob('*.pptx'))
    assert len(files)==1,(n,files)
    path=files[0]; presentation=Presentation(path)
    texts=['\n'.join(shape.text for shape in slide.shapes if shape.has_text_frame) for slide in presentation.slides]
    sequence=next(i for i,t in enumerate(texts) if 'UML SEQUENCE DIAGRAM' in t.upper())
    architecture=next(i for i,t in enumerate(texts) if 'UML COMPONENT VIEW' in t.upper())
    overview=next(i for i,t in enumerate(texts) if 'The workflow at a glance' in t)
    steps=[i for i,t in enumerate(texts) if 'CODE EXCERPT' in t]
    assert len(steps)==6 and sequence<architecture<overview<min(steps),(n,'structure')
    assert sum(shape.shape_type==13 for slide in list(presentation.slides)[:sequence] for shape in slide.shapes)>=2,(n,'GUI screenshots')
    review=json.loads((folder/'source-review.json').read_text(encoding='utf8'))
    assert len(review['steps'])==6
    for step in review['steps']:
        source=(ROOT/step['path']);data=source.read_bytes()
        assert hashlib.sha256(data).hexdigest()==step['sourceSha256'],(n,step['path'],'source changed')
        assert step['sourceExcerpt'] in source.read_text(encoding='utf8'),(n,step['step'],'excerpt changed')
        assert len(step['displayedExcerpt'].splitlines())<=10
    source_labels=[]
    for step,slide_index in zip(review['steps'],steps):
        expected=step['path']+f" · L{step['line']}"
        shape_index=next(i+1 for i,shape in enumerate(presentation.slides[slide_index].shapes) if shape.has_text_frame and shape.text==expected)
        source_labels.append({'slide':slide_index+1,'shape':shape_index})
    title=review['title']; rows.append({'lab':n,'title':title,'slides':len(presentation.slides),'architecture_slide':architecture+1,'code_slides':[i+1 for i in steps],'source_labels':source_labels,'path':path.relative_to(ROOT/'presentations').as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})

index=ROOT/'presentations/Labs-23-75.html'
items='\n'.join(f'<a class="card" href="{html.escape(row["path"])}"><span>LAB {row["lab"]:02}</span><h2>{html.escape(row["title"])}</h2><p>{row["slides"]} slides · Open PowerPoint ↗</p></a>' for row in rows)
index.write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labs 23–75 · Presentations</title><style>body{margin:0;background:#f5f4ef;color:#20312b;font:17px Arial}main{max-width:1200px;margin:auto;padding:55px 28px}h1{font:42px Georgia;margin:12px 0 20px}.intro{max-width:800px;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin-top:35px}.card{padding:25px;background:white;border:1px solid #d8e0d9;border-radius:9px;color:inherit;text-decoration:none}.card:hover{border-color:#c65330}.card span{color:#c65330;font-weight:bold;font-size:13px}.card h2{font:24px Georgia;line-height:1.25;min-height:62px}.card p{font-size:14px;color:#64766e}</style><main><span>CLAUDE MANAGED AGENTS</span><h1>Labs 23–75</h1><p class="intro">53 PowerPoint presentations. Each follows the course structure: GUI controls and representative evidence, UML workflow and application architecture, workflow summary cards, and one slide for each code step.</p><p><a href="Labs-23-75-PowerPoints.zip">Download all 53 PowerPoints</a></p><div class="grid">'''+items+'</div></main></html>',encoding='utf8')

archive=ROOT/'presentations/Labs-23-75-PowerPoints.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as output:
    for row in rows:
        path=ROOT/'presentations'/row['path'];output.write(path,f'Lab-{row["lab"]:02}/{path.name}')
with zipfile.ZipFile(archive) as output:
    assert len(output.namelist())==53 and output.testzip() is None
report={'decks':len(rows),'slides':sum(r['slides'] for r in rows),'source_excerpts':53*6,'archive':archive.name,'presentations':rows}
(ROOT/'presentations/Labs-23-75-validation.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print(f'Validated {len(rows)} decks, {report["slides"]} slides and 318 source excerpts. Packaged {archive.name}.')
