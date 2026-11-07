"""Freeze reviewed GitHub objects separately from the instructor's working tree."""
from pathlib import Path
import subprocess,json,hashlib
R=Path(__file__).resolve().parents[1];N='managed-agents-platform-architecture-v2';P=R/'presentations'/N;V=R/'videos'/N;S=P/'github-source';S.mkdir(parents=True,exist_ok=True);V.mkdir(parents=True,exist_ok=True)
SHA='7717a10d62fd399185ae5d3d6a9ad108a17c5519'
old=json.loads((R/'videos/managed-agents-platform-architecture/source-review.json').read_text(encoding='utf-8'))
paths=sorted({r['path'] for r in old['sources']}|{'package-lock.json','docs/sdk-upgrade.md','README.md','tests/lab01-query.test.ts','tests/sse.test.ts'})
files=[]
for p in paths:
 data=subprocess.check_output(['git','show',f'{SHA}:{p}'],cwd=R);dest=S/p;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data);files.append({'path':p,'sha256':hashlib.sha256(data).hexdigest()})
pkg=json.loads((S/'package.json').read_text(encoding='utf-8'));lock=json.loads((S/'package-lock.json').read_text(encoding='utf-8'));names=['@anthropic-ai/sdk','react','react-dom','vite','typescript','express','zod','tsx','@playwright/test','@modelcontextprotocol/sdk','ws','@anthropic-ai/aws-sdk','@opentelemetry/sdk-trace-base']
versions={n:{'declared':(pkg['dependencies']|pkg['devDependencies'])[n],'locked':lock['packages']['node_modules/'+n]['version']} for n in names}
changes=[n for n in names if versions[n]['declared']!=(json.loads(subprocess.check_output(['git','show','91b93ab:package.json'],cwd=R))['dependencies']|json.loads(subprocess.check_output(['git','show','91b93ab:package.json'],cwd=R))['devDependencies'])[n]]
e={'repository':'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75','branch':'main','commit':SHA,'sourceUrl':f'https://github.com/luiscoco/Udemy-claude-managed-agents-Lab-75/tree/{SHA}','nodeRequirement':pkg['engines']['node'],'versions':versions,'changedDirectDeclarations':changes,'sources':files,'liveExecutionClaimed':False,'snapshotOnly':True}
(V/'github-review.json').write_text(json.dumps(e,indent=2));print(json.dumps({'commit':SHA,'versions':versions,'changedDirectDeclarations':changes},indent=2))
base=(R/'scripts/create-managed-platform-architecture.py').read_text(encoding='utf-8')
base=base.replace("N='managed-agents-platform-architecture'",f"N='{N}'").replace("V.mkdir(parents=True,exist_ok=True)","V.mkdir(parents=True,exist_ok=True)\nSOURCE=P/'github-source'\nREVIEW=json.loads((V/'github-review.json').read_text(encoding='utf-8'))")
base=base.replace('SDK 0.133.0','SDK 1.3.0').replace('Anthropic SDK 0.133.0','Anthropic SDK 1.3.0')
base=base.replace("(R/p).is_file()","(SOURCE/p).is_file()").replace("(R/p).read_bytes()","(SOURCE/p).read_bytes()")
base=base.replace("'scope':'Repository implementation, not general SDK advice'","'scope':'GitHub main commit 7717a10; declarations and exact lockfile resolutions', 'commit':REVIEW['commit'], 'sourceUrl':REVIEW['sourceUrl']")
base=base.replace('CLAUDE MANAGED AGENTS · LEARNING PLATFORM\',\'Tech Stack','CLAUDE MANAGED AGENTS · GITHUB MAIN 7717a10\',\'Tech Stack')
base=base.replace('Versions belong to this repository snapshot; check package.json when updating.','GitHub main · 7717a10 · package.json ranges and package-lock.json resolutions checked.')
base=base.replace('Core package declarations: React 19 · Vite 8 · TypeScript 7 · Zod 4 · Anthropic SDK 1.3.0','Locked stack: React 19.3.0 · Vite 8.3.4 · Express 5.3.0 · TypeScript 7.0.2 · SDK 1.3.0')
base=base.replace('The package versions shown here describe this repository snapshot, rather than a recommendation to upgrade.','The direct Anthropic SDK is pinned to one point three point zero on GitHub main. Exact package resolutions are recorded in its lockfile.')
insert='''
# Versions are read from the frozen GitHub lockfile, never the older installed tree.
locked=REVIEW['versions']
items=[('lock-react','React + React DOM','react'),('lock-vite','Vite','vite'),('lock-express','Express','express'),('lock-typescript','TypeScript','typescript'),('lock-zod','Zod','zod'),('lock-anthropic','Anthropic TypeScript SDK','@anthropic-ai/sdk')]
version_cards=''.join(card(cid,label+'<br>'+locked[name]['locked'],'Manifest: '+html.escape(locked[name]['declared'])+'<br>Resolved in package-lock.json') for cid,label,name in items)
add('Exact versions in the GitHub repository',head('VERSION BASELINE · GITHUB MAIN 7717a10','Read the manifest and the lockfile together')+'<div class="version-grid">'+version_cards+'</div>',[
 ('lock-react','The locked React and React DOM versions are nineteen point three point zero.'),
 ('lock-vite','The manifest permits Vite eight point three releases; the lockfile resolves eight point three point four.'),
 ('lock-express','Express is declared with a compatible five point two point one range, but its locked version is five point three point zero.'),
 ('lock-typescript','TypeScript resolves to seven point zero point two.'),
 ('lock-zod','Zod resolves to four point six point five.'),
 ('lock-anthropic','The direct Anthropic TypeScript SDK is exactly one point three point zero. These are versions in the reviewed GitHub commit, rather than an unpinned claim about whichever package is newest later.')],['package.json','package-lock.json'])
add('What the SDK upgrade changed',head('SDK 1.3.0 · SHARED HOST CONFIGURATION','Report the installed version; control instrumentation')+'<div class="two"><div>'+cue('upgrade-version','<h2>Runtime version reporting</h2><p>Read VERSION from the SDK package.<br>Keep the lockfile with the manifest.<br>Use npm ci for reproducible installs.</p>')+'<div class="banner">'+cue('upgrade-tracing','<p>Automatic SDK telemetry is disabled here.<br>Explicit host tracing remains separate.</p>')+'</div></div><div class="code"><div class="label">server/lib/managed-config.ts · excerpts</div>'+cue('upgrade-code','<pre>'+html.escape("import { VERSION } from \\n  '@anthropic-ai/sdk/version';\\n\\nopenTelemetry: {\\n  propagation: false,\\n  traces: { enabled: false }\\n},\\nmaxRetries: 0,\\ntimeout: 15000")+'</pre>')+'</div></div>',[
 ('upgrade-version','The upgraded host imports the SDK version constant instead of hard-coding the old version in readiness metadata. Use npm ci with the committed lockfile to reproduce the reviewed installation.'),
 ('upgrade-tracing','The shared clients disable automatic SDK tracing and propagation. That setting is separate from explicit application tracing in the observability labs.'),
 ('upgrade-code','The configuration also preserves zero automatic retries and a bounded timeout. Session creation, stream-before-send ordering, and explicit lifecycle cleanup remain part of the same architecture.')],['server/lib/managed-config.ts','docs/sdk-upgrade.md'])
'''
base=base.replace("body=head('COMPONENT ARCHITECTURE'",insert+"\nbody=head('COMPONENT ARCHITECTURE'")
base=base.replace("slides=[]","css+='.version-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:28px}.version-grid .card{min-height:270px;padding:25px}.version-grid h2{font-size:34px}.version-grid p{font-size:27px}'\nslides=[]")
base=base.replace('CLAUDE MANAGED AGENTS · TECH STACK & ARCHITECTURE</span>','CLAUDE MANAGED AGENTS · GITHUB 7717a10 · ARCHITECTURE</span>')
base=base.replace("'mediaPrefix':'Claude-Managed-Agents-Platform-Architecture'","'mediaPrefix':'Claude-Managed-Agents-Platform-Architecture-v2'").replace("'outputFile':'Claude-Managed-Agents-Platform-Architecture.mp4'","'outputFile':'Claude-Managed-Agents-Platform-Architecture-v2.mp4'")
(R/'scripts/create-managed-platform-architecture-v2.py').write_text(base,encoding='utf-8')
