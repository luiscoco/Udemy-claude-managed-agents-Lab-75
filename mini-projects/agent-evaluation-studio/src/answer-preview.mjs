export function answerPreview(text,maxLength=160){
 const normalized=String(text??'')
  .replace(/```[\s\S]*?```/g,' Code example. ')
  .replace(/!\[([^\]]*)\]\([^)]+\)/g,'$1')
  .replace(/\[([^\]]+)\]\([^)]+\)/g,'$1')
  .replace(/`([^`]+)`/g,'$1')
  .replace(/^\s{0,3}#{1,6}\s+/gm,'')
  .replace(/^\s*[-*+]\s+/gm,'')
  .replace(/[*_~]{1,2}/g,'')
  .replace(/\s+/g,' ').trim();
 return normalized.length>maxLength?normalized.slice(0,maxLength).trimEnd()+'…':normalized;
}
