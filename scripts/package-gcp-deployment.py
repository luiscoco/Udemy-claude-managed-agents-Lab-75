"""Build a GCP source ZIP from the verified course application snapshot."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'artifacts/aws-deployment/claude-learning-aws.zip'
BASE_SHA = '6a64ba8f3f2e17216ca7a5d5cfc8edf7c1cdba511f561877e94fc9a2e266d4db'
OUT = ROOT / 'artifacts/gcp-deployment'


def main():
    with BASE.open('rb') as handle:
        if hashlib.file_digest(handle, 'sha256').hexdigest() != BASE_SHA:
            raise RuntimeError('Verified base snapshot checksum differs.')
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'claude-learning-gcp.zip'
    overrides = {name: (ROOT / name).read_bytes() for name in [
        '.dockerignore', '.gitignore', 'gcp/cloudshell-deploy.py', 'gcp/cloudbuild.json',
        'gcp/verify-source.py', 'gcp/README.md', 'scripts/test-gcp-deployment.py',
        'scripts/package-gcp-deployment.py']}
    for name in ['gcp/STUDENT-GUIDE.html', 'gcp/STUDENT-GUIDE.pdf', 'gcp/START-HERE.txt']:
        if (ROOT / name).is_file(): overrides[name] = (ROOT / name).read_bytes()
    # This recording package contains no instructor state or deployment credentials.
    excluded = {'aws/source-manifest.json'}
    manifest = {}
    with zipfile.ZipFile(BASE) as original, zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=3) as output:
        for entry in original.infolist():
            name = entry.filename
            if name in overrides or name in excluded or entry.is_dir(): continue
            if name.startswith(('/', 'gcp-state/', 'artifacts/', '.git/', 'node_modules/')) or '..' in Path(name).parts:
                raise RuntimeError('Unexpected source path: ' + name)
            if Path(name).name in {'.env', 'recording-access.json', 'deployment-config.json'}:
                raise RuntimeError('Private configuration in base snapshot: ' + name)
            data = original.read(entry)
            manifest[name] = hashlib.sha256(data).hexdigest()
            output.writestr(name, data)
        for name, data in overrides.items():
            manifest[name] = hashlib.sha256(data).hexdigest()
            output.writestr(name, data)
        output.writestr('gcp/source-manifest.json', json.dumps(manifest, indent=2))
    # Read the finished archive back and verify every source entry's checksum.
    with zipfile.ZipFile(target) as archive:
        for name, expected in manifest.items():
            if hashlib.sha256(archive.read(name)).hexdigest() != expected:
                raise RuntimeError('Packaged checksum mismatch: ' + name)
        if set(archive.namelist()) != set(manifest) | {'gcp/source-manifest.json'}:
            raise RuntimeError('Unexpected packaged files.')
    with target.open('rb') as handle: sha = hashlib.file_digest(handle, 'sha256').hexdigest()
    report = {'file': target.name, 'bytes': target.stat().st_size, 'sha256': sha,
              'sourceFiles': len(manifest), 'baseSourceSha256': BASE_SHA,
              'cloudResourcesCreated': False, 'containsRecordingCredentials': False}
    (OUT / 'package-report.json').write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))


if __name__ == '__main__': main()
