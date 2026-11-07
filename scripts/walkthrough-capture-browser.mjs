// Bound shutdown of the browser owned by one capture. Never target the user's browser.
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';

export async function captureBrowser() {
  const server = await chromium.launchServer({channel:'msedge',headless:true});
  const browser = await chromium.connect(server.wsEndpoint());
  const bounded = async fn => {
    let timer;
    try { await Promise.race([fn().catch(()=>{}),new Promise(resolve=>{timer=setTimeout(resolve,5000)})]); }
    finally { clearTimeout(timer); }
  };
  return {
    browser,
    async close() {
      await bounded(()=>browser.close());
      await bounded(()=>server.close());
      const process = server.process();
      if (process.exitCode === null && process.pid) {
        try {
          if (globalThis.process.platform === 'win32') execFileSync('taskkill.exe',['/PID',String(process.pid),'/T','/F'],{windowsHide:true,stdio:'ignore',timeout:10000});
          else process.kill('SIGKILL');
        } catch { /* It may have exited between inspection and termination. */ }
      }
    },
  };
}
