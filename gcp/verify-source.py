"""Verify the source archive before the Docker build without printing file contents."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'gcp/source-manifest.json').read_text())
for name, expected in manifest.items():
    path = root / name
    if not path.resolve().is_relative_to(root) or path.is_symlink():
        raise SystemExit('Unexpected source path: ' + name)
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise SystemExit('Source checksum mismatch: ' + name)
print(f'Verified {len(manifest)} packaged source files.')
