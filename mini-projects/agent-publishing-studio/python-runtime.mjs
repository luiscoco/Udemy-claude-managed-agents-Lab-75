export const pythonExecutable=()=>process.env.PYTHON||(process.platform==='win32'?'python':'python3');

export function pythonFailure(child,task){
 const detail=String(child.stderr??'').replace(/\x1b\[[0-9;]*m/g,'');
 const missing=/ModuleNotFoundError:\s*No module named ['"]([^'"]+)['"]/.exec(detail)?.[1];
 if(missing){
  const packageName={PIL:'Pillow',fitz:'PyMuPDF',pymupdf:'PyMuPDF'}[missing]??missing;
  return `${task} needs ${packageName} in the Python environment used by this app. From the Agent Publishing Studio folder, run: ${pythonExecutable()} -m pip install -r requirements.txt`;
 }
 if(child.error?.code==='ENOENT')return `${task} needs Python. Install Python and the packages in requirements.txt, or set PYTHON to its executable path.`;
 if(child.error?.code==='ETIMEDOUT')return `${task} timed out while processing the file.`;
 const lastLine=detail.trim().split(/\r?\n/).filter(Boolean).at(-1)?.trim();
 return `${task} failed: ${(lastLine||child.error?.message||'Check that Python requirements are installed.').slice(0,240)}`;
}
