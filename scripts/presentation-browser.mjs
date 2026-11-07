import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Keep a complete DOM component at a readable width. A separate document removes
// application overlays without changing the captured text, values, or controls.
export async function captureComponent(locator, target, stagePage, width=1080) {
  const html = await locator.evaluate(el => {
    const copy=el.cloneNode(true);
    const originals=[el,...el.querySelectorAll('*')], copies=[copy,...copy.querySelectorAll('*')];
    const properties=['font-family','font-size','font-weight','font-style','color','background-color','border','border-radius','padding','margin','display','gap','grid-template-columns','align-items','line-height','white-space','overflow-wrap','text-align'];
    originals.forEach((node,i)=>{
      const style=getComputedStyle(node);
      for(const prop of properties) copies[i].style.setProperty(prop,style.getPropertyValue(prop));
      if(node instanceof HTMLInputElement){copies[i].setAttribute('value',node.value);if(node.checked)copies[i].setAttribute('checked','');else copies[i].removeAttribute('checked');}
      if(node instanceof HTMLTextAreaElement) copies[i].textContent=node.value;
      if(node instanceof HTMLSelectElement) [...copies[i].options].forEach((o,j)=>{o.selected=node.options[j].selected;if(o.selected)o.setAttribute('selected','');else o.removeAttribute('selected');});
      copies[i].style.position='static'; copies[i].style.maxWidth='100%';
    });
    return copy.outerHTML;
  });
  await stagePage.setViewportSize({width:width+32,height:1000});
  await stagePage.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:16px;background:#fffdf7;color:#18242a;font:16px Arial}#capture{width:${width}px}button,select,input,textarea{font:16px Arial}table{width:100%;border-collapse:collapse}pre,code{white-space:pre-wrap;overflow-wrap:anywhere}img{max-width:100%}</style><div id="capture">${html}</div>`);
  await stagePage.locator('#capture').screenshot({path:target});
}

if(import.meta.url.endsWith(process.argv[1]?.replaceAll('\\','/').split('/').at(-1))){
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 const catalog={};
 try{
  for(let n=23;n<=75;n++){
   await page.goto(`http://127.0.0.1:5174/?lesson=${n}`);
   await page.getByRole('tab',{name:'Run the exercise'}).click();
   await page.waitForTimeout(600);
   const section=page.locator(`[aria-labelledby="lab${n}-heading"]`);
   const root=await section.count()?section:page.getByRole('tabpanel').filter({visible:true}).last();
   catalog[n]=await root.evaluate(el=>({buttons:[...el.querySelectorAll('button')].map(e=>({text:e.textContent,disabled:e.disabled})),selects:[...el.querySelectorAll('select')].map(e=>({label:e.getAttribute('aria-label')||e.closest('label')?.textContent,options:[...e.options].map(o=>({text:o.text,value:o.value}))})),labels:[...el.querySelectorAll('[aria-label]')].map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')}))}));
   console.log(`Inspected Lab ${n}`);
  }
  await writeFile('presentations/presentation-ui-catalog.json',JSON.stringify(catalog,null,2));
 }finally{await browser.close()}
}
