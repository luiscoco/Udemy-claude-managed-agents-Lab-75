import {readdir,writeFile} from 'node:fs/promises';
import {extname} from 'node:path';
const root=new URL('../mini-projects/',import.meta.url),files=[];
const allowed=new Set(['.mjs','.jsx','.json','.md','.css','.html','.py','.txt','.svg','.yml']);
async function walk(relative=''){
 for(const entry of await readdir(new URL(relative,root),{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error('Symlink in project source: '+entry.name);
  if(['node_modules','dist','.git','artifacts','__pycache__','.claude'].includes(entry.name))continue;
  const name=relative+entry.name;
  if(entry.isDirectory())await walk(name+'/');
  else if(entry.isFile()&&(allowed.has(extname(entry.name))||['.env.example','.gitignore'].includes(entry.name)))files.push(name);
 }
}
await walk();files.sort();await writeFile(new URL('../shared/mini-project-files.json',import.meta.url),JSON.stringify(files,null,2)+'\n');
console.log('Reviewed-source archive manifest: '+files.length+' files.');
