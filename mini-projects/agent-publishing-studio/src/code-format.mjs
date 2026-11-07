import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';

for (const [name, grammar] of Object.entries({javascript, typescript, python, json, bash, xml, css})) hljs.registerLanguage(name, grammar);
const aliases={js:'javascript',jsx:'javascript',mjs:'javascript',ts:'typescript',tsx:'typescript',py:'python',sh:'bash',shell:'bash',html:'xml',svg:'xml'};
const palette={default:'EAF2FF',keyword:'D2ADFF',literal:'D2ADFF',string:'A9E3A0',regexp:'A9E3A0',number:'FFC18B',symbol:'FFC18B',meta:'FFC18B',title:'8ED8FF',type:'8CE4DB',built_in:'8CE4DB',comment:'B8C7DE',attr:'FFC2DF',property:'FFC2DF',variable:'FFC2DF',attribute:'FFC2DF',subst:'EAF2FF'};
export const escapeCode=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function highlightCode(source, hint=''){
 const code=String(source).replace(/\r\n?/g,'\n');
 const language=aliases[String(hint).toLowerCase()]??String(hint).toLowerCase();
 if(code.length>100000||!hljs.getLanguage(language))return {html:escapeCode(code),language:language||'text'};
 try{return {html:hljs.highlight(code,{language,ignoreIllegals:true}).value,language};}
 catch{return {html:escapeCode(code),language:'text'};}
}
export function codeLines(source,language){
 const {html}=highlightCode(source,language),lines=[[]],stack=[];
 const decode=value=>value.replace(/&(?:amp|lt|gt|quot|#39);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'"})[entity]);
 for(const part of html.match(/<[^>]*>|[^<]+/g)??[]){
  if(part.startsWith('<span'))stack.push(/hljs-([\w-]+)/.exec(part)?.[1]??'default');
  else if(part==='</span>')stack.pop();
  else {const color=palette[[...stack].reverse().find(name=>palette[name])]??palette.default;
   for(const [index,piece] of decode(part).split('\n').entries()){
    if(index)lines.push([]);
    if(piece)lines.at(-1).push({text:piece,color});
   }
  }
 }
 return lines;
}
