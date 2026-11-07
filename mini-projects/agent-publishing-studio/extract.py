"""Extract bounded local upload text. PDF support requires PyMuPDF (pip install pymupdf)."""
import io
import sys
import zipfile
from xml.etree import ElementTree

kind = sys.argv[1]
data = sys.stdin.buffer.read(5_000_001)
if len(data) > 5_000_000:
    raise SystemExit('Upload exceeds 5 MB')
if kind in ('text/plain', 'text/markdown', 'text/csv'):
    result = data.decode('utf-8-sig')
elif kind == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        info = archive.getinfo('word/document.xml')
        if info.file_size > 2_000_000:
            raise SystemExit('DOCX extracted XML exceeds limit')
        root = ElementTree.fromstring(archive.read(info))
        ns = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        result = '\n'.join(''.join(t.text or '' for t in p.iter(ns + 't')) for p in root.iter(ns + 'p'))
elif kind == 'application/pdf':
    try:
        import pymupdf as fitz
    except ImportError:
        raise SystemExit('PDF extraction requires PyMuPDF: pip install pymupdf')
    doc = fitz.open(stream=data, filetype='pdf')
    if doc.page_count > 80:
        raise SystemExit('PDF exceeds 80-page project limit')
    result = '\n'.join(page.get_text() for page in doc)
else:
    raise SystemExit('Unsupported file type')
sys.stdout.write(result[:50_000])
