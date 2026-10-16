import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const brand = JSON.parse(readFileSync(new URL('../assets/brand.json', import.meta.url), 'utf8'));
export class SpecError extends Error { constructor(path, message) { super(`SPEC ERROR ${path} ${message}`); } }
const fail = (path, message) => { throw new SpecError(path, message); };
const object = (value, keys, path) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'must be an object');
  if (Object.keys(value).some(key => !keys.includes(key)) || keys.some(key => !(key in value))) fail(path, `requires exactly ${keys.join(', ')}`);
};
const text = (value, path, max = 1200) => {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) fail(path, `must be nonempty literal text of at most ${max} characters`);
};
export function validateSpec(spec) {
  object(spec, ['title', 'kind', 'classification', 'date', 'blocks'], '$'); text(spec.title, '$.title', 100);
  if (!/^[\p{L}\p{N} ]+$/u.test(spec.title)) fail('$.title', 'use plain words numbers and spaces');
  if (!['ordinary', 'incident'].includes(spec.kind)) fail('$.kind', 'must be ordinary or incident');
  if (!brand.classifications.includes(spec.classification)) fail('$.classification', 'must match the brand allowlist');
  if (typeof spec.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(spec.date) || Number.isNaN(Date.parse(`${spec.date}T00:00:00Z`)) ||
    new Date(`${spec.date}T00:00:00Z`).toISOString().slice(0, 10) !== spec.date) fail('$.date', 'must be a real ISO date');
  if (!Array.isArray(spec.blocks) || !spec.blocks.length || spec.blocks.length > 40) fail('$.blocks', 'requires 1 to 40 blocks');
  spec.blocks.forEach((block, index) => { const path = `$.blocks[${index}]`;
    if (block?.type === 'paragraph') { object(block, ['type', 'text'], path); text(block.text, `${path}.text`); }
    else if (block?.type === 'heading') { object(block, ['type', 'level', 'text'], path); if (![1, 2].includes(block.level)) fail(`${path}.level`, 'must be 1 or 2'); text(block.text, `${path}.text`, 100); }
    else if (block?.type === 'list') { object(block, ['type', 'ordered', 'items'], path); if (typeof block.ordered !== 'boolean') fail(`${path}.ordered`, 'must be boolean');
      if (!Array.isArray(block.items) || !block.items.length || block.items.length > 10) fail(`${path}.items`, 'requires 1 to 10 items'); block.items.forEach((item, i) => text(item, `${path}.items[${i}]`, 400)); }
    else if (block?.type === 'table') { object(block, ['type', 'headers', 'rows', 'widths'], path);
      if (!Array.isArray(block.headers) || block.headers.length < 2 || block.headers.length > 6) fail(`${path}.headers`, 'requires 2 to 6 columns');
      block.headers.forEach((item, i) => text(item, `${path}.headers[${i}]`, 50));
      if (!Array.isArray(block.widths) || block.widths.length !== block.headers.length || block.widths.some(width => !Number.isInteger(width) || width < 5 || width > 95) || block.widths.reduce((a, b) => a + b, 0) !== 100) fail(`${path}.widths`, 'integer percentages must match columns and sum to 100');
      if (!Array.isArray(block.rows) || !block.rows.length || block.rows.length > 20) fail(`${path}.rows`, 'requires 1 to 20 rows');
      block.rows.forEach((row, r) => { if (!Array.isArray(row) || row.length !== block.headers.length) fail(`${path}.rows[${r}]`, 'column count differs'); row.forEach((item, c) => text(item, `${path}.rows[${r}][${c}]`, 300)); });
    } else fail(`${path}.type`, 'unsupported block');
  });
  if (JSON.stringify(spec).length > 16000) fail('$', 'document spec exceeds 16 KiB');
  if (spec.kind === 'incident') {
    const headings = spec.blocks.filter(block => block.type === 'heading' && block.level === 1).map(block => block.text);
    if (JSON.stringify(headings) !== JSON.stringify(['Summary', 'Impact', 'Timeline', 'Root cause', 'Action items'])) fail('$.blocks', 'incident level-one sections must be Summary Impact Timeline Root cause Action items in order');
    const actionIndex = spec.blocks.findIndex(block => block.type === 'heading' && block.text === 'Action items');
    if (!spec.blocks.slice(actionIndex + 1).some(block => block.type === 'table' && block.headers.includes('Owner') && block.headers.includes('Due'))) fail('$.blocks', 'Action items requires an Owner and Due table');
  }
  return spec;
}
const xml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
const run = value => `<w:r><w:t xml:space="preserve">${xml(value).replaceAll('\n', '</w:t><w:br/><w:t xml:space="preserve">').replaceAll('\t', '</w:t><w:tab/><w:t xml:space="preserve">')}</w:t></w:r>`;
const paragraph = (value, style = 'Normal', extra = '') => `<w:p><w:pPr><w:pStyle w:val="${style}"/>${extra}</w:pPr>${run(value)}</w:p>`;
function crc32(data) { let crc = 0xffffffff; for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
export function zipFiles(files) {
  const chunks = [], central = []; let offset = 0;
  for (const [name, value] of Object.entries(files).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    const filename = Buffer.from(name), data = Buffer.isBuffer(value) ? value : Buffer.from(value); const crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(filename.length, 26);
    chunks.push(local, filename, data); const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(33, 14); entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(filename.length, 28); entry.writeUInt32LE(offset, 42); central.push(entry, filename); offset += local.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(Object.keys(files).length, 8); end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16); return Buffer.concat([...chunks, directory, end]);
}
export function buildDocx(input) {
  const spec = validateSpec(input); let listId = 0; const numbering = [];
  const blocks = spec.blocks.map(block => {
    if (block.type === 'paragraph') return paragraph(block.text);
    if (block.type === 'heading') return paragraph(block.text, `Heading${block.level}`);
    if (block.type === 'list') { const id = ++listId; numbering.push(`<w:num w:numId="${id}"><w:abstractNumId w:val="${block.ordered ? 1 : 0}"/>${block.ordered ? '<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride>' : ''}</w:num>`);
      return block.items.map(item => paragraph(item, 'Normal', `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${id}"/></w:numPr>`)).join(''); }
    const widths = block.widths.map(width => Math.round(9000 * width / 100));
    const row = (cells, header) => `<w:tr><w:trPr>${header ? '<w:tblHeader/>' : ''}<w:cantSplit/></w:trPr>${cells.map((cell, index) => `<w:tc><w:tcPr><w:tcW w:w="${widths[index]}" w:type="dxa"/>${header ? `<w:shd w:fill="${brand.tableHeaderFill}"/>` : ''}</w:tcPr><w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r>${header ? `<w:rPr><w:b/><w:color w:val="${brand.tableHeaderText}"/></w:rPr>` : ''}<w:t xml:space="preserve">${xml(cell)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`;
    return `<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(edge => `<w:${edge} w:val="single" w:sz="4" w:color="B8C6D6"/>`).join('')}</w:tblBorders><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map(width => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${row(block.headers, true)}${block.rows.map(cells => row(cells, false)).join('')}</w:tbl>${paragraph(' ')}`;
  }).join('');
  const ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${ns} xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${paragraph(spec.title, 'Title')}${paragraph(`${spec.classification}   ${spec.date}`, 'Metadata')}${blocks}<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1453" w:bottom="1134" w:left="1453" w:header="567" w:footer="567"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8"?><w:styles ${ns}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${brand.bodyFont}" w:hAnsi="${brand.bodyFont}"/><w:sz w:val="${brand.bodySizeHalfPoints}"/><w:color w:val="000000"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="180"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="${brand.titleSizeHalfPoints}"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Metadata"><w:name w:val="Metadata"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="240"/></w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:style>${[1, 2].map(level => `<w:style w:type="paragraph" w:styleId="Heading${level}"><w:name w:val="heading ${level}"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="200" w:after="100"/><w:outlineLvl w:val="${level - 1}"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="${level === 1 ? brand.headingSizeHalfPoints : 26}"/></w:rPr></w:style>`).join('')}<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="Footer"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr></w:style></w:styles>`;
  const nums = `<?xml version="1.0" encoding="UTF-8"?><w:numbering ${ns}>${[false, true].map((ordered, index) => `<w:abstractNum w:abstractNumId="${index}"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${ordered ? 'decimal' : 'bullet'}"/><w:lvlText w:val="${ordered ? '%1.' : 'â€¢'}"/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="360"/></w:tabs><w:ind w:left="360" w:hanging="180"/></w:pPr></w:lvl></w:abstractNum>`).join('')}${numbering.join('')}</w:numbering>`;
  const footer = `<?xml version="1.0" encoding="UTF-8"?><w:ftr ${ns}><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr>${run('Page ')}<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>${run('1')}<w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const rel = (id, type, target) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
  return zipFiles({ '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${[['/word/document.xml','document.main'],['/word/styles.xml','styles'],['/word/numbering.xml','numbering'],['/word/footer1.xml','footer']].map(([part, type]) => `<Override PartName="${part}" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.${type}+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rel('rIdDocument','officeDocument','word/document.xml')}<Relationship Id="rIdCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>${rel('rIdApp','extended-properties','docProps/app.xml')}</Relationships>`,
    'docProps/core.xml': `<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(spec.title)}</dc:title><dc:creator>Managed Agents Lab 72</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${spec.date}T00:00:00Z</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${spec.date}T00:00:00Z</dcterms:modified></cp:coreProperties>`,
    'docProps/app.xml': '<?xml version="1.0" encoding="UTF-8"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Managed Agents Lab 72</Application></Properties>',
    'word/document.xml': document, 'word/styles.xml': styles, 'word/numbering.xml': nums, 'word/footer1.xml': footer,
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rel('rIdStyles','styles','styles.xml')}${rel('rIdNumbering','numbering','numbering.xml')}${rel('rIdFooter','footer','footer1.xml')}</Relationships>` });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const args = process.argv.slice(2); if (args.length !== 4 || args[0] !== '--spec' || args[2] !== '--out') fail('$arguments', 'use --spec checked.json --out document.docx');
    const bytes = buildDocx(JSON.parse(readFileSync(args[1], 'utf8'))); mkdirSync(dirname(args[3]), { recursive: true }); writeFileSync(args[3], bytes);
    process.stdout.write(JSON.stringify({ built: true, bytes: bytes.length }) + '\n');
  } catch (error) { console.error(error instanceof SpecError ? error.message : 'SPEC ERROR $ invalid JSON or build input'); process.exitCode = 2; }
}
