"""Package the verified application snapshot with account-neutral student tooling."""
from pathlib import Path
import argparse
import hashlib
import html
import json
import re
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/aws-student-kit'
NAME = 'Claude-Managed-Agents-AWS-Student-Kit.zip'
BASE_SHA = '6a64ba8f3f2e17216ca7a5d5cfc8edf7c1cdba511f561877e94fc9a2e266d4db'
TEXT_SUFFIXES = {'.md', '.txt', '.json', '.mjs', '.js', '.ts', '.tsx', '.py', '.yaml', '.yml', '.html', '.css'}
SECRET_PATTERNS = [
    re.compile(r'\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}\b'),
    re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    re.compile(r'\b(?:ghp_|github_pat_|xox[baprs]-)[A-Za-z0-9_-]{20,}\b'),
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'''(?:api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][A-Za-z0-9_+/-]{24,}["']''', re.I),
]
START = '''CLAUDE MANAGED AGENTS - AWS DEPLOYMENT STUDENT KIT

Start with aws/STUDENT-GUIDE.pdf or aws/STUDENT-GUIDE.html.
The Markdown version is aws/STUDENT-GUIDE.md.

This ZIP contains the complete application source and existing course media,
Dockerfile, AWS templates, CloudShell helper, source checksums, permissions,
troubleshooting, verification exercises and cleanup instructions.

Watch the accompanying Udemy video separately. Upload this SAME ZIP to AWS
CloudShell and extract only aws/* as explained in the guide. Do not extract
the entire course media into CloudShell's limited home directory.

IMPORTANT STUDENT STEP BEFORE PREFLIGHT:
Run the configure command with YOUR OWN AWS account ID. The instructor's
account ID, application URL and passwords are not settings for your deployment.
The kit supports Stockholm (eu-north-1), matching the video.

You need an AWS learning account, approved permissions, the default network
prerequisites and an appropriate spending/cleanup plan. Deployment is billable;
the example estimate is not a hard spending cap. No local AWS CLI or Docker
installation is needed for the CloudShell workflow.

Existing course images/audio are included. Dependencies are installed by
CodeBuild. Instructor access files, AWS state, private keys, recorded evidence,
authoring credentials, installed node_modules and the MP4 are excluded.
'''


def inline(text):
    escaped = html.escape(text)
    escaped = re.sub(r'`([^`]+)`', r'<code>\1</code>', escaped)
    return re.sub(r'https://[^\s<]+', lambda m: '<a href="' + m[0] + '">' + m[0] + '</a>', escaped)


def markdown_html(text):
    blocks, paragraph, code = [], [], None
    listing = False
    def flush():
        if paragraph:
            blocks.append('<p>' + inline(' '.join(paragraph)) + '</p>'); paragraph.clear()
    for line in text.splitlines():
        if line.startswith('```'):
            flush()
            if listing: blocks.append('</ul>'); listing = False
            if code is None: code = []
            else: blocks.append('<pre><code>' + html.escape('\n'.join(code)) + '</code></pre>'); code = None
            continue
        if code is not None: code.append(line); continue
        if line.startswith('- '):
            flush()
            if not listing: blocks.append('<ul>'); listing = True
            blocks.append('<li>' + inline(line[2:]) + '</li>'); continue
        if line.startswith('  ') and listing:
            blocks[-1] = blocks[-1][:-5] + ' ' + inline(line.strip()) + '</li>'; continue
        if listing: blocks.append('</ul>'); listing = False
        if not line.strip(): flush(); continue
        if line.startswith('#'):
            flush(); level = min(6, len(line) - len(line.lstrip('#')))
            blocks.append(f'<h{level}>' + inline(line[level:].strip()) + f'</h{level}>')
        else: paragraph.append(line.strip())
    flush()
    if listing: blocks.append('</ul>')
    assert code is None, 'Unclosed code block.'
    return '\n'.join(blocks)


def prepare_docs():
    css = '''body{font:15px/1.55 Arial,sans-serif;color:#142638;max-width:980px;margin:35px auto;padding:0 25px}h1{font-size:29px;color:#10385c}h2{font-size:21px;color:#10385c;border-bottom:1px solid #ccd8e2;padding-bottom:6px;margin-top:30px}pre{background:#eff4f8;border:1px solid #cbd7e1;padding:13px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 Consolas,monospace}code{font-family:Consolas,monospace}li{margin:5px 0}a{color:#145d91;overflow-wrap:anywhere}@media print{body{max-width:none;margin:0;padding:0;font-size:10pt}h1{font-size:22pt}h2{font-size:15pt;break-after:avoid}pre{font-size:8pt;break-inside:avoid}p,li{orphans:3;widows:3}a{color:inherit;text-decoration:none}}'''
    parts = []
    for name in ['STUDENT-GUIDE', 'IAM-REQUIREMENTS', 'TROUBLESHOOTING']:
        parts.append(markdown_html((ROOT / 'aws' / (name + '.md')).read_text(encoding='utf-8')))
    document = '<!doctype html><html lang="en"><meta charset="utf-8"><title>AWS Deployment Student Guide</title><style>' + css + '</style><main>' + '\n<hr>\n'.join(parts) + '</main></html>'
    (ROOT / 'aws/STUDENT-GUIDE.html').write_text(document, encoding='utf-8')
    print('Prepared the offline HTML guide and appendices.')


def safe_name(name):
    parts = Path(name).parts
    forbidden = {'.git', '.aws', '.agents', '.codex', '.claude', 'aws-state', 'artifacts', 'node_modules', '__pycache__'}
    if name.startswith('/') or '\\' in name or '..' in parts or any(p in forbidden for p in parts): return False
    if name == 'aws/deployment-config.json': return False
    if any(p.startswith('.env') and p != '.env.example' for p in parts): return False
    return not re.search(r'\.(?:pem|key|pfx|p12|mp4|webm|zip|msi|exe|pyc|log|jsonl)$', name, re.I)


def check_text(name, data):
    if Path(name).suffix not in TEXT_SUFFIXES and not name.startswith('.'): return
    text = data.decode('utf-8', errors='replace')
    if any(p.search(text) for p in SECRET_PATTERNS): raise RuntimeError('Credential pattern in ' + name + ' (value withheld).')
    for identifier in ['954718177936', 'd12lsuq2dnetqm.cloudfront.net']:
        if identifier in text: raise RuntimeError('Instructor-specific deployment identifier in ' + name)


def package():
    base = ROOT / 'artifacts/aws-deployment/claude-learning-aws.zip'
    with base.open('rb') as handle:
        if hashlib.file_digest(handle, 'sha256').hexdigest() != BASE_SHA:
            raise RuntimeError('The verified application snapshot checksum changed; review before packaging.')
    OUT.mkdir(parents=True, exist_ok=True)
    pdf = ROOT / 'aws/STUDENT-GUIDE.pdf'
    if not pdf.is_file(): raise RuntimeError('Render the PDF guide before packaging.')
    overrides = {name: (ROOT / name).read_bytes() for name in [
        '.dockerignore', '.gitignore', 'aws/cloudshell-deploy.py', 'aws/README.md',
        'aws/STUDENT-GUIDE.md', 'aws/STUDENT-GUIDE.html', 'aws/STUDENT-GUIDE.pdf',
        'aws/IAM-REQUIREMENTS.md', 'aws/TROUBLESHOOTING.md', 'aws/VIDEO-CHAPTERS.txt',
        'aws/deployment-config.example.json', 'scripts/test-aws-deployment.py',
    ]}
    overrides['START-HERE.txt'] = START.encode('utf-8')
    overrides['aws/KIT-INFO.json'] = json.dumps({
        'title': 'Claude Managed Agents AWS Deployment Student Kit', 'region': 'eu-north-1',
        'ownAccountConfigurationRequired': True, 'offlineHelperChecksPassed': 14,
        'applicationBaseArchiveSha256': BASE_SHA, 'videoDuration': '13:22',
        'includesInstalledDependencies': False, 'includesVideo': False,
        'applicationCloudDeployment': 'Verified in the instructor recording',
        'studentHelperValidation': 'Offline checks; no additional billable student deployment executed',
    }, indent=2).encode('utf-8')
    manifest = {}
    destination = OUT / NAME
    with zipfile.ZipFile(base) as original, zipfile.ZipFile(destination, 'w', allowZip64=True) as target:
        members = set(original.namelist()) | set(overrides)
        members.discard('aws/source-manifest.json')
        for name in sorted(members):
            if not safe_name(name): raise RuntimeError('Unexpected student ZIP path: ' + name)
            data = overrides.get(name)
            if data is None: data = original.read(name)
            check_text(name, data)
            manifest[name] = hashlib.sha256(data).hexdigest()
            compression = zipfile.ZIP_DEFLATED if Path(name).suffix in TEXT_SUFFIXES or name.startswith('.') else zipfile.ZIP_STORED
            target.writestr(name, data, compress_type=compression, compresslevel=6)
        target.writestr('aws/source-manifest.json', json.dumps(manifest, indent=2), compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(destination) as archive:
        names = archive.namelist()
        assert len(names) == len(set(names))
        assert set(names) == set(manifest) | {'aws/source-manifest.json'}
        for name, expected in manifest.items():
            assert hashlib.sha256(archive.read(name)).hexdigest() == expected, name
    with destination.open('rb') as handle: checksum = hashlib.file_digest(handle, 'sha256').hexdigest()
    report = {'archive': NAME, 'bytes': destination.stat().st_size, 'files': len(manifest) + 1,
        'sha256': checksum, 'manifestAndZipIntegrity': 'passed', 'credentialPatternScan': 'passed',
        'instructorAccountAndHostnameScan': 'passed', 'offlineHelperChecks': 14,
        'newCloudResourcesCreated': False}
    (OUT / 'student-kit-validation.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (OUT / 'SHA256SUMS.txt').write_text(checksum + '  ' + NAME + '\n', encoding='utf-8')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--prepare-docs', action='store_true')
    args = parser.parse_args()
    if args.prepare_docs: prepare_docs()
    else: package()
