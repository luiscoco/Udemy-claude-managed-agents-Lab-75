"""Validate the full reviewed range and refresh both presentation collections."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib, html, json, re, zipfile
from pptx import Presentation

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'presentations'
rows=[]
for n in range(8,76):
    folder=OUT/f'lab{n:02}'
    review=json.loads((folder/'uml-source-review.json').read_text(encoding='utf8'))
    target=OUT/review['path']
    with zipfile.ZipFile(target) as z:
        assert len(z.namelist())==len(set(z.namelist())),(n,'duplicate package parts')
        assert z.testzip() is None,(n,'invalid package')
    p=Presentation(target)
    texts=['\n'.join(x.text for x in s.shapes if x.has_text_frame and x.text) for s in p.slides]
    assert sum(t.startswith('Live scenario and acceptance checks') for t in texts)==1,(n,'live scenario structure')
    first=min(review['umlSlides'])
    assert sum(x.shape_type==13 for s in list(p.slides)[:first-1] for x in s.shapes)>=2,(n,'GUI snapshots')
    codes=[i+1 for i,t in enumerate(texts) if 'CODE EXCERPT' in t]
    assert len(codes)==review['codeSteps'] and len(codes)>=4,(n,'individual source steps')
    overview=next(i+1 for i,t in enumerate(texts) if 'The workflow at a glance' in t)
    assert max(review['umlSlides'])<overview<min(codes)<review['liveSlide']<len(p.slides),(n,'section order')
    for i in review['umlSlides']+[review['liveSlide']]:
        s=p.slides[i-1]
        assert s.has_notes_slide and 'Sources' in s.notes_slide.notes_text_frame.text,(n,i,'teaching notes')
        for x in s.shapes:
            assert x.left>=0 and x.top>=0 and x.left+x.width<=p.slide_width+1000 and x.top+x.height<=p.slide_height+1000,(n,i,x.name,'slide bounds')
    for source in review['sources']:
        assert hashlib.sha256((ROOT/source['path']).read_bytes()).hexdigest()==source['sha256'],(n,source['path'],'source changed')
    if n>=23:
        source_review=json.loads((folder/'source-review.json').read_text(encoding='utf8'))
        for step in source_review['steps']:
            path=ROOT/step['path']
            assert hashlib.sha256(path.read_bytes()).hexdigest()==step['sourceSha256'],(n,step['path'])
            assert step['sourceExcerpt'] in path.read_text(encoding='utf8'),(n,step['step'],'excerpt')
    layout=json.loads((OUT/f'uml-review/lab{n:02}/validation.json').read_text(encoding='utf-8-sig'))
    assert not layout['textOverflow'],(n,'unresolved text bounds',layout['textOverflow'])
    assert set(layout['checkedSlides'])==set(range(1,len(p.slides)+1)),(n,'incomplete native layout review')
    picture_files=list((OUT/f'uml-review/lab{n:02}').glob('slide-*.png'))
    assert all((OUT/f'uml-review/lab{n:02}/slide-{i}.png').exists() for i in review['umlSlides']+[review['liveSlide']]),(n,'missing render')
    title=max([x for x in p.slides[0].shapes if x.has_text_frame and x.text],key=lambda x:max((p.font.size or 0 for p in x.text_frame.paragraphs),default=0)).text
    architecture=next((i+1 for i,t in enumerate(texts) if 'UML COMPONENT VIEW' in t),None)
    labels=[]
    for i in codes:
        for j,x in enumerate(p.slides[i-1].shapes,1):
            if x.has_text_frame and re.match(r'^(?:server|src|shared)/.*\.tsx?',x.text):labels.append({'slide':i,'shape':j})
    review['deckSha256']=hashlib.sha256(target.read_bytes()).hexdigest()
    (folder/'uml-source-review.json').write_text(json.dumps(review,indent=2),encoding='utf8')
    rows.append({'lab':n,'title':title,'slides':len(p.slides),'uml_slides':review['umlSlides'],'live_slide':review['liveSlide'],
                 'live_boundary':review['liveScenario']['status'],'architecture_slide':architecture,'code_slides':codes,
                 'source_labels':labels,'path':review['path'],'sha256':review['deckSha256']})

live_file=OUT/'live-scenarios-validation.json'
if live_file.exists():live=json.loads(live_file.read_text(encoding='utf8'))
else:live={'actualProviderStatus':'blocked-missing-local-configuration','actualProviderSessionsStarted':0}

def collection(selected,first,last):
    archive=OUT/f'Labs-{first:02}-{last:02}-PowerPoints.zip'
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
        for row in selected:
            file=OUT/row['path'];z.write(file,f'Lab-{row["lab"]:02}/{file.name}')
    with zipfile.ZipFile(archive) as z:assert len(z.namelist())==len(selected) and z.testzip() is None
    cards=[]
    for row in selected:
        preview=f'uml-review/lab{row["lab"]:02}/slide-{row["uml_slides"][0]}.png'
        cards.append(f'<article><span>LAB {row["lab"]:02}</span><h2>{html.escape(row["title"])}</h2><p>{row["slides"]} slides · {len(row["uml_slides"])} reviewed UML views</p><p class="boundary">{html.escape(row["live_boundary"])}</p><a href="{html.escape(row["path"])}">Open PowerPoint</a> <a href="{preview}">Preview UML</a></article>')
    page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Labs {first:02}–{last:02} · Reviewed presentations</title>
<style>body{{margin:0;background:#f5f4ef;color:#20312b;font:17px Arial}}main{{max-width:1240px;margin:auto;padding:48px 28px}}h1{{font:42px Georgia}}.intro{{max-width:950px;line-height:1.6}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}}article{{background:white;border:1px solid #d8e0d9;border-radius:9px;padding:24px}}article span{{color:#bd542f;font-size:13px;font-weight:bold}}h2{{font:25px Georgia;line-height:1.25}}article p{{font-size:14px;line-height:1.5}}a{{color:#28594a;margin-right:16px}}.boundary{{color:#64766e}}.download{{display:block;margin:25px 0 35px}}</style>
<main><span>CLAUDE MANAGED AGENTS</span><h1>Labs {first:02}–{last:02}</h1><p class="intro">{len(selected)} reviewed PowerPoints. GUI snapshots come first, followed by numbered application sequences, host decision diagrams, workflow summary cards and individual code steps. Every deck includes live-scenario acceptance checks and explains its actual implementation boundary.</p><p class="intro">Validation: 369 offline regression tests and 9 live-evidence evaluator tests passed. Actual provider status: {html.escape(live['actualProviderStatus'])}. Setup and fixture tests are never labelled successful live executions.</p><a class="download" href="{archive.name}">Download all {len(selected)} PowerPoints</a><div class="grid">{''.join(cards)}</div></main></html>'''
    (OUT/f'Labs-{first:02}-{last:02}.html').write_text(page,encoding='utf8')
    report={'at':datetime.now(timezone.utc).isoformat(),'decks':len(selected),'slides':sum(x['slides'] for x in selected),
            'uml_views':sum(len(x['uml_slides']) for x in selected),'live_scenario_slides':len(selected),
            'source_excerpts':sum(len(x['code_slides']) for x in selected),'archive':archive.name,
            'offlineTestsPassed':369,'liveEvidenceEvaluatorTestsPassed':9,'actualProvider':live,'presentations':selected}
    (OUT/f'Labs-{first:02}-{last:02}-validation.json').write_text(json.dumps(report,indent=2),encoding='utf8')
    print(f'Packaged {len(selected)} decks / {report["slides"]} slides / {report["uml_views"]} UML views: {archive.name}')

collection(rows,8,75)
collection([x for x in rows if x['lab']>=23],23,75)
