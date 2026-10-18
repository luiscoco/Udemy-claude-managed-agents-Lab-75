"""Append the adopted learning platform prompts while preserving existing content."""
from pathlib import Path
import hashlib
import json
import re
from docx import Document
from docx.shared import Pt

root = Path(__file__).resolve().parents[1]
folder = root / 'docs' / 'prompt-migration'
canonical = folder / 'Claude-Managed-Agents-Prompts-Labs-01-75.docx'
alias = folder / 'Claude-Managed-Agents-Prompts-Labs-01-75-With-Visual-Style-Prompt-2026-10-14.docx'
source = root / 'docs' / 'learning-platform-prompts.md'
title = 'Learning platform implementation supplement'
doc = Document(canonical)
original = [p.text for p in doc.paragraphs]
if title in original:
    index = original.index(title)
    # The supplement begins on a new page; remove its preceding page break too.
    if index and not original[index - 1].strip():
        index -= 1
    for paragraph in list(doc.paragraphs)[index:]:
        paragraph._element.getparent().remove(paragraph._element)
else:
    index = len(original)
preserved = [p.text for p in doc.paragraphs]
before_blocks = preserved.count('COPY PROMPT START')
text = source.read_text(encoding='utf-8')
sections = re.split(r'^## ', text, flags=re.MULTILINE)
doc.add_page_break()
doc.add_paragraph(title, 'Heading 1')
doc.add_paragraph(sections[0].split('\n\n', 1)[1].strip(), 'Context Body')
for section in sections[1:]:
    heading, body = section.split('\n', 1)
    doc.add_page_break()
    doc.add_paragraph(heading.strip(), 'Heading 2')
    for block in body.strip().split('\n\n'):
        paragraph = doc.add_paragraph(block.strip(), 'Context Marker' if block.startswith('COPY PROMPT') else 'Context Body')
        if not block.startswith('COPY PROMPT'):
            paragraph.paragraph_format.keep_with_next = False
            paragraph.paragraph_format.space_after = Pt(9)
doc.core_properties.modified = __import__('datetime').datetime(2026, 10, 18, 12, 0)
doc.save(canonical)
alias.write_bytes(canonical.read_bytes())
updated = Document(canonical)
assert [p.text for p in updated.paragraphs[:len(preserved)]] == preserved
assert [int(re.match(r'Lab (\d+)', p.text).group(1)) for p in updated.paragraphs
        if p.style.style_id == 'Heading1' and re.match(r'Lab \d+', p.text)] == list(range(1, 76))
assert [p.text for p in updated.paragraphs].count('COPY PROMPT START') == before_blocks + 6
assert [p.text for p in updated.paragraphs].count('COPY PROMPT END') == before_blocks + 6
manifest_path = folder / 'migration-manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['updated_prompt_blocks'] = before_blocks + 6
manifest['updated_docx'] = str(canonical)
manifest['learning_platform_supplement'] = {
    'date': '2026-10-18', 'source': str(source.relative_to(root)),
    'preserved_prompt_blocks': before_blocks, 'added_prompt_blocks': 6,
    'sha256': hashlib.sha256(canonical.read_bytes()).hexdigest(),
}
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(json.dumps(manifest['learning_platform_supplement']))
