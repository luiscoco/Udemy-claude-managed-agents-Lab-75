"""Verify download contents against audited decks and local preview links."""
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1] / 'presentations'


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        self.links.extend(v for k, v in attrs if k in ('href', 'src'))


def main():
    audited = {}
    for n in range(1, 76):
        meta = json.loads((ROOT / f'lab{n:02}/contrast-review.json').read_text())
        path = ROOT / meta['path']
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        assert digest == meta['sha256'], (n, 'deck changed after audit')
        audited[f'Lab-{n:02}/{path.name}'] = digest
    for first in (1, 7, 8, 23):
        archive = ROOT / f'Labs-{first:02}-75-PowerPoints.zip'
        with zipfile.ZipFile(archive) as z:
            expected = {k: v for k, v in audited.items() if int(k[4:6]) >= first}
            assert set(z.namelist()) == set(expected), archive
            for name, digest in expected.items():
                assert hashlib.sha256(z.read(name)).hexdigest() == digest, (archive, name)
        parser = Links()
        parser.feed((ROOT / f'Labs-{first:02}-75.html').read_text(encoding='utf8'))
        for link in parser.links:
            assert (ROOT / link).exists(), link
        print(f'{archive.name}: {len(expected)} current decks; preview links valid.', flush=True)


if __name__ == '__main__':
    main()
