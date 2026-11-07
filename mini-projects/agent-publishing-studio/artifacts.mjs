import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {makePackage} from './lib/package.mjs';
import {documentParts,validateSpec} from './lib/build-docx.mjs';
import {documentSpec,infographicSpec} from './src/document-spec.mjs';
import {highlightCode,codeLines} from './src/code-format.mjs';
import {svgTechnicalInfographic} from './technical-infographic.mjs';
import {svgEditorialInfographic} from './editorial-infographic.mjs';

const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const theme={font:'Calibri',bodySize:22,headingSize:28,titleSize:40,headingColor:'12284A',tableHeader:'173B50',tableStripe:'F2F5F7',border:'D9E1EC',producer:'Agent Publishing Studio'};
export function htmlDocument(input){const spec=documentSpec.parse(input);const content=spec.blocks.map(block=>block.type==='heading'?`<h${block.level+1}>${xml(block.text)}</h${block.level+1}>`:block.type==='paragraph'?`<p>${xml(block.text)}</p>`:block.type==='bullets'?`<ul>${block.items.map(item=>`<li>${xml(item)}</li>`).join('')}</ul>`:`<table><thead><tr>${block.columns.map(x=>`<th>${xml(x)}</th>`).join('')}</tr></thead><tbody>${block.rows.map(row=>`<tr>${row.map(x=>`<td>${xml(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`).join('');return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:20mm}body{font:16px/1.55 Arial,sans-serif;color:#17294a;max-width:800px;margin:auto}h1{font-size:31px;margin:0 0 8px}h2{font-size:22px;border-bottom:2px solid #d6e7fa;padding-bottom:5px;margin-top:28px}h3{font-size:18px;margin-top:22px}.meta{color:#506584;margin-bottom:28px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #b9c9da;padding:8px;text-align:left}th{background:#173b50;color:white}tr:nth-child(even){background:#f2f5f7}p,li{overflow-wrap:anywhere}</style></head><body><h1>${xml(spec.title)}</h1><div class="meta">${xml(spec.author)} | ${xml(spec.date)}</div>${content}</body></html>`;}
export function htmlDocumentWithCode(input){
 const spec=documentSpec.parse(input);
 if(!spec.blocks.some(block=>block.type==='code'))return htmlDocument(spec);
 const parts=spec.blocks.map(block=>{
  if(block.type==='code'){const {html,language}=highlightCode(block.code,block.language);return `<section class="code-panel"><div class="code-label">${xml(language)}</div><pre><code>${html}</code></pre></section>`;}
  return htmlDocument({...spec,blocks:[block]}).match(/<div class="meta">[\s\S]*?<\/div>([\s\S]*?)<\/body>/)?.[1]??'';
 }).join('');
 const base=htmlDocument({...spec,blocks:[{type:'paragraph',text:'Code preview'}]});
 return base.replace('<p>Code preview</p>',parts).replace('</style>',`.code-panel{margin:18px 0;border-radius:10px;overflow:hidden;border:1px solid #496483;break-inside:avoid;background:#0b1930}.code-label{background:#183254;color:#cde5ff;padding:7px 14px;font:700 12px Arial;text-transform:uppercase}.code-panel pre{margin:0;padding:14px;white-space:pre-wrap;overflow-wrap:anywhere;color:#eaf2ff;font:13px/1.55 Consolas,monospace}.hljs-keyword,.hljs-literal{color:#d2adff}.hljs-string,.hljs-regexp{color:#a9e3a0}.hljs-number,.hljs-meta{color:#ffc18b}.hljs-title{color:#8ed8ff}.hljs-type,.hljs-built_in{color:#8ce4db}.hljs-comment{color:#b8c7de}.hljs-attr,.hljs-property,.hljs-variable{color:#ffc2df}</style>`);
}
export function svgInfographic(input){
 const spec=infographicSpec.parse(input),height=spec.items.length<=4?640:830,positions=spec.items.length===3?[[42,230],[570,230],[306,410]]:[[42,230],[570,230],[42,410],[570,410],[42,590],[570,590]],colors=['#e9f2ff','#e5fbf6','#fff1e5','#f1eaff','#e7f5ff','#fff4e0'];
 const words=spec.title.split(/\s+/),titleLines=[''];for(const word of words){const last=titleLines.length-1;if((titleLines[last]+' '+word).trim().length>43&&titleLines.length<2)titleLines.push(word);else titleLines[last]=(titleLines[last]+' '+word).trim();}
 const card=(item,i)=>{const [x,y]=positions[i];return `<rect x="${x}" y="${y}" width="488" height="150" rx="22" fill="${colors[i]}" stroke="#c5d6e8"/><circle cx="${x+38}" cy="${y+37}" r="21" fill="#1b65c9"/><text x="${x+38}" y="${y+44}" text-anchor="middle" class="number">${i+1}</text><text x="${x+72}" y="${y+45}" class="label">${xml(item.label)}</text><foreignObject x="${x+25}" y="${y+62}" width="438" height="80"><div xmlns="http://www.w3.org/1999/xhtml" style="font:18px/1.3 Arial,sans-serif;color:#294364;overflow-wrap:anywhere;max-height:80px;overflow:hidden">${xml(item.detail)}</div></foreignObject>`};
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${height}" viewBox="0 0 1100 ${height}" role="img" aria-label="${xml(spec.title)}"><title>${xml(spec.title)}</title><style>.title{font:bold 38px Arial,sans-serif;fill:#10234a}.subtitle{font:21px Arial,sans-serif;fill:#335477}.label{font:bold 24px Arial,sans-serif;fill:#13284b}.number{font:bold 22px Arial,sans-serif;fill:white}.takeaway{font:bold 19px Arial,sans-serif;fill:#102b50}</style><rect width="1100" height="${height}" fill="#f8fbff"/><rect width="1100" height="200" fill="#dceeff"/>${titleLines.map((line,i)=>`<text x="42" y="${72+i*45}" class="title">${xml(line)}</text>`).join('')}<text x="42" y="175" class="subtitle">${xml(spec.subtitle)}</text>${spec.items.map(card).join('')}<rect x="42" y="${height-60}" width="1016" height="45" rx="12" fill="#dceeff"/><text x="60" y="${height-29}" class="takeaway">${xml(spec.takeaway)}</text></svg>`;
}
async function render(html,kind){const browser=await chromium.launch({headless:true});try{const page=await browser.newPage({viewport:{width:1100,height:830},deviceScaleFactor:1});await page.setContent(html,{waitUntil:'load'});return kind==='pdf'?Buffer.from(await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true})):Buffer.from(await page.locator('svg').first().screenshot({type:'png'}));}finally{await browser.close();}}
export function svgInfographicWithCode(input,style=null){
 const spec=infographicSpec.parse(input);
 if(style&&(style.visual?style.visual.layout==='editorial':style.layout==='technical'))return svgEditorialInfographic(spec,style);
 if(style)return svgTechnicalInfographic(spec,style);
 const base=styledInfographic(svgInfographic(spec),style);
 if(!spec.codeExample)return base;
 const oldHeight=spec.items.length<=4?640:830,newHeight=oldHeight+230;
 const lines=codeLines(spec.codeExample.code,spec.codeExample.language).slice(0,7);
 const codeText=lines.map((line,index)=>`<text x="68" y="${oldHeight+78+index*22}" font-family="Consolas,monospace" font-size="18" xml:space="preserve">${line.map(segment=>`<tspan fill="#${segment.color}">${xml(segment.text)}</tspan>`).join('')}</text>`).join('');
 const panel=`<rect x="42" y="${oldHeight+14}" width="1016" height="195" rx="15" fill="#0b1930"/><text x="68" y="${oldHeight+48}" fill="#d3eaff" font-family="Arial,sans-serif" font-size="18" font-weight="bold">CODE EXCERPT · ${xml(spec.codeExample.language.toUpperCase())}</text>${codeText}`;
 const background=style?.background??'#f8fbff';
 return base.replace(`height="${oldHeight}" viewBox="0 0 1100 ${oldHeight}"`,`height="${newHeight}" viewBox="0 0 1100 ${newHeight}"`).replace(`<rect width="1100" height="${oldHeight}" fill="${background}"/>`,`<rect width="1100" height="${newHeight}" fill="${background}"/>`).replace('</svg>',panel+'</svg>');
}
function styledInfographic(svg,style){
 if(!style)return svg;
 for(const key of ['background','ink','accent','secondary'])if(!/^#[0-9a-fA-F]{6}$/.test(style[key]??''))throw Error('The image palette is invalid. Upload the PNG again.');
 const mix=(a,b,weight)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-weight)+parseInt(b.slice(i,i+2),16)*weight).toString(16).padStart(2,'0')).join('');
 const accent=mix(style.background,style.accent,style.mood==='dark'?.55:.75);
 const secondary=mix(style.background,style.secondary,style.mood==='dark'?.55:.75);
 const paleAccent=mix(style.background,style.accent,style.mood==='dark'?.18:.12);
 const paleSecondary=mix(style.background,style.secondary,style.mood==='dark'?.18:.12);
 const replacements={'#f8fbff':style.background,'#dceeff':paleAccent,'#10234a':style.ink,'#335477':style.ink,'#13284b':style.ink,'#102b50':style.ink,'#294364':style.ink,'#1b65c9':accent,'#c5d6e8':paleSecondary,'#e9f2ff':paleAccent,'#e5fbf6':paleSecondary,'#fff1e5':paleAccent,'#f1eaff':paleSecondary,'#e7f5ff':paleAccent,'#fff4e0':paleSecondary};
 return svg.replace(/#[0-9a-fA-F]{6}/g,color=>replacements[color.toLowerCase()]??color);
}
export async function createArtifact(kind,format,spec,style=null){let data,mime;if(kind==='document'){const parsed=documentSpec.parse(spec),errors=validateSpec(parsed);if(errors.length)throw Error(`Document plan rejected: ${errors[0]}`);if(format==='docx'){data=makePackage(documentParts(parsed,theme));mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';}else if(format==='pdf'){data=await render(htmlDocumentWithCode(parsed),'pdf');mime='application/pdf';}else throw Error('Choose DOCX or PDF.');}else if(kind==='infographic'){const svg=svgInfographicWithCode(spec,style);if(format==='svg'){data=Buffer.from(svg);mime='image/svg+xml';}else if(format==='png'){data=await render(svg,'png');mime='image/png';}else throw Error('Choose SVG or PNG.');}else throw Error('Unknown artifact type.');return{data,mime,sha256:createHash('sha256').update(data).digest('hex')};}
