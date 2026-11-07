import { chromium } from 'playwright';
const browser = await chromium.launch({headless:true, channel:'msedge'});
const page = await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
try {
  for (const n of [7,8]) {
    await page.goto(`http://127.0.0.1:5174/?lesson=${n}`);
    await page.getByRole('tab', {name:'Run the exercise'}).click();
    if(n===7) await page.locator('#c7-policy').selectOption('deny-write');
    await page.getByRole('button',{name:n===7?'Run offline fixture':'Run offline delegation'}).click();
    const table=page.getByRole('table',{name:n===7?'Policy audit':'Effect ledger'});
    await table.waitFor({timeout:30000});
    async function capture(locator, path) {
      await locator.evaluate(el=>{
        const stage=document.createElement('div'); stage.id='presentation-capture';
        Object.assign(stage.style,{position:'fixed',zIndex:'99999',top:'0',left:'0',width:'1480px',padding:'18px',background:'#fffdf7',color:'#18242a'});
        const copy=el.cloneNode(true); Object.assign(copy.style,{width:'100%',tableLayout:'auto',background:'#fffdf7',color:'#18242a'});
        stage.append(copy); document.body.append(stage);
      });
      await page.locator('#presentation-capture').screenshot({path});
      await page.locator('#presentation-capture').evaluate(el=>el.remove());
    }
    await capture(table,`presentations/lab0${n}/assets/evidence.png`);
    if(n===8) await capture(page.getByRole('table',{name:'Session threads'}),'presentations/lab08/assets/threads.png');
    console.log(`Captured offline evidence for Lab ${n}`);
  }
} finally { await browser.close(); }
