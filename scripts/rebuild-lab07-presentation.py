from pathlib import Path
import importlib.util
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor

spec = importlib.util.spec_from_file_location('course', 'scripts/rebuild-course-presentations.py')
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
b = c.b
p = Presentation(); p.slide_width = Inches(13.333333); p.slide_height = Inches(7.5)
blank = p.slide_layouts[6]
def slide(title, label):
    s = p.slides.add_slide(blank); c.heading(s, title, label, 7, len(p.slides)); return s
def cards(title, label, items):
    s = slide(title, label)
    for i, (head, body) in enumerate(items): c.card(s, .7+i*4.03, 1.75, 3.85, 4.4, head, body)
    return s
s = p.slides.add_slide(blank); b.bg(s, '172A25'); c.rect(s, 0, 0, .14, 7.5, 'E5744A')
b.textbox(s, .85, .72, 7.3, .35, 'CLAUDE MANAGED AGENTS  /  LAB 07', 13, 'EAA185', True)
b.textbox(s, .85, 1.55, 7.5, 1.8, 'Tool policy and execution audit', 38, 'FFFFFF', True, 'Georgia')
b.textbox(s, .9, 4.0, 7.0, 1.5, 'Trace how the host validates, applies policy, executes custom tools and records the evidence.', 21, 'D8E5DB')
c.rect(s, 8.75, 1.25, 3.65, 4.9, '23453A', '3A6152', True)
for y, num, label in [(1.75,'01','EXPLORE THE GUI'),(2.75,'02','TRACE THE FLOW'),(3.75,'03','READ THE CODE'),(4.75,'04','VERIFY THE AUDIT')]:
    b.textbox(s,9.1,y,.55,.4,num,15,'F1A083',True); b.textbox(s,9.85,y,2.25,.55,label,15,'FFFFFF',True)
cards('Choose a host policy', 'GUI · policy experiment', [
 ('Audit only','A valid edit updates draft.md.\nThe audit shows file contents\nbefore and after execution.'),
 ('Deny write','A protected-file change is refused before the handler runs.'),
 ('Rewrite input','A proposed path is rewritten to the draft path, then the effective input is validated again.')])
s = slide('Policy experiment controls', 'GUI · application view')
from PIL import Image
img = Path('presentations/lab07/assets/overview.png'); im = Image.open(img)
w = min(11.9, 5.1*im.width/im.height); h = w*im.height/im.width
pic = s.shapes.add_picture(str(img), Inches((13.333-w)/2), Inches(1.55), width=Inches(w), height=Inches(h))
# Remove the incomplete control visible below the complete fieldset in this capture.
pic.crop_bottom = .035
cards('Inspect the evidence', 'GUI · audit and file evidence', [
 ('Decision','Compare the policy\nwith its recorded decision\nand the reason.'),
 ('Validation','Compare original and effective inputs. A rewrite reports revalidated.'),
 ('Execution and effect','Check whether the handler ran, its result, and file content before and after.')])
evidence = Path('presentations/lab07/assets/evidence.png')
if evidence.exists():
    s = slide('A protected write is denied', 'GUI · offline audit evidence')
    im = Image.open(evidence); w = min(11.85, 4.7*im.width/im.height); h = w*im.height/im.width
    s.shapes.add_picture(str(evidence), Inches((13.333-w)/2), Inches(1.65), width=Inches(w), height=Inches(h))
    if h < 3.8:
        for i, (head, body) in enumerate([
            ('1 · Valid input', 'validation: passed\nThe input is valid;\npolicy can still deny it.'),
            ('2 · Deny before execution', 'handlerRan: false\nThe protected edit never\nreaches the handler.'),
            ('3 · Verify the file', 'before = after\nBoth reads still show\nlocked in protected.md.')]):
            c.card(s, .7+i*4.03, 4.05, 3.85, 2.55, head, body)
cards('Compare failure and denial', 'GUI · offline scenarios', [
 ('Denied','The policy blocks a protected-file edit. The handler does not run.'),
 ('Handler exception','The call is allowed, but the handler fails. This differs from a denial.'),
 ('Repeated call','A repeated custom-tool event receives at most one correlated result.')])
spec = importlib.util.spec_from_file_location('uml07', 'scripts/lab07-uml.py')
uml = importlib.util.module_from_spec(spec); spec.loader.exec_module(uml)
uml.build(slide, c.rect, c.flat, b)

steps=[
 ('Choose the experiment','src/concepts/Concept07Hooks.tsx','The UI sends the selected policy, offline scenario and prompt to the Lab 07 endpoint.',"streamPost('/api/c7/query', {\n  mode, policy, scenario, prompt,\n  deadlineSeconds: 30,\n  handlerTimeoutMs: 1000\n  // live budget omitted\n})"),
 ('Validate and prepare','server/concepts/07-hooks.ts','The route validates the request, selects a fixture or live port, and creates a sandbox with draft and protected files.',"const parsed = lab07RequestSchema\n  .safeParse(request.body);\nconst sandbox = await createSandbox();\nawait sandbox.writeText(\n  'workspace/draft.md', /* ... */);"),
 ('Start the session','server/lib/lab07-run.ts','The runner delegates to the shared tool-session loop and supplies an answer callback for pending custom-tool calls.',"const core = await runToolSession({\n  mode: requested.mode,\n  prompt: requested.prompt,\n  port: counted, sandbox, signal,\n  async answer(pending, context) {\n    // evaluate each pending call\n  }\n});"),
 ('Validate tool and input','server/lib/lab07-policy.ts','The host rejects unknown tools and inputs that fail the tool schema before running a handler.',"const shape = lab07ToolShapes[\n  input.name as Lab07ToolName];\nconst parsed = shape.safeParse(\n  input.raw);\nif (!parsed.success) {\n  // return denial; handler did not run\n}"),
 ('Deny protected writes','server/lib/lab07-policy.ts','The deny-write policy stops a protected-file change before execution and records before and after evidence.',"if (input.policy === 'deny-write' &&\n    input.name !== 'read_file' &&\n    originalPath ===\n      '/workspace/protected.md') {\n  // deny; handlerRan: false\n}"),
 ('Rewrite and revalidate','server/lib/lab07-policy.ts','The rewrite policy changes proposed.md to draft.md and validates the whole effective input again.',"effective = { ...effective,\n  path: '/workspace/draft.md' };\ndecision = 'rewrite';\nvalidation = 'revalidated';\nconst checked = shape.safeParse(\n  effective);"),
 ('Execute and record','server/lib/lab07-policy.ts','The host records before and after file contents around permitted execution. A failure differs from denial; a timeout does not undo file effects.',"const before = await input.sandbox\n  .readText(relative)\n  .catch(() => null);\nconst result = await Promise.race([\n  work(), /* deadline */\n]);\nconst after = await input.sandbox\n  .readText(relative)\n  .catch(() => null);"),
 ('Answer and inspect','server/lib/lab07-run.ts','The audit is emitted and a result is associated with the original custom-tool event ID. The UI displays the evidence.',"audits.push(audit);\ncontext.emit({ kind: 'audit', audit });\nanswers.push({\n  customToolUseId: call.id,\n  tool: audit.tool,\n  isError: audit.result.isError,\n  text: audit.result.text\n});")]
s=slide('The workflow at a glance','From policy choice to audit evidence')
for i,(title,_,_,_) in enumerate(steps):
    x=.8+(i%4)*3.15; y=1.75+(i//4)*2.35; c.rect(s,x,y,2.9,1.95,'FFFFFF','D8E0D9',True)
    b.textbox(s,x+.22,y+.22,.5,.45,str(i+1),20,'C65330',True); b.textbox(s,x+.22,y+.85,2.46,.85,title.replace('Execute and record','Execute and\nrecord'),19,b.INK,True)
for i,(title,path,body,code) in enumerate(steps):
    s=slide(f'{i+1} · {title}','Workflow step')
    b.textbox(s,.85,1.7,5.5,.35,'WHAT HAPPENS',11,'C65330',True)
    b.textbox(s,.95,2.25,5.45,3.4,body,22,b.INK)
    c.rect(s,6.8,1.65,5.75,4.65,'1C302A',None,True)
    b.textbox(s,7.08,1.98,5.18,.35,'CODE EXCERPT · SIMPLIFIED',11,'F27C55',True)
    b.textbox(s,7.08,2.55,5.18,2.9,code,18,'F5F5EE',False,'Consolas')
    b.textbox(s,7.08,5.64,5.18,.45,path,11,'B8C9BE',False,'Consolas')
    for j in range(8): c.rect(s,.85+j*.7,6.62,.57,.055,'D36A45' if j==i else 'CAD7CD',None,True)
    b.textbox(s,6.52,6.52,1.4,.22,f'STEP {i+1} / 8',9,'5C7567',True)
cards('Prove the protected file stays unchanged','Student challenge',[
 ('Run','Choose deny-write and run the offline fixture.'),
 ('Inspect','Find the decision, handler status and before/after contents in the audit.'),
 ('Explain','Why does pre-execution denial prevent the change, while a later audit cannot reverse an effect?')])
target=next(Path('presentations/lab07/output').glob('*.pptx')); p.save(target); print(f'Saved {target}: {len(p.slides)} slides')
