import * as vscode from 'vscode';
import { randomBytes, randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { allowedDocument, documentSnapshot, Lab69HostReview } from '../../../server/lib/lab69-host.js';
import { lab69PatchSchema, lab69WebviewMessageSchema, type Lab69Context } from '../../../shared/lab69-embedding-sdk.js';

const pendingCleanup = new Set<Promise<unknown>>();
function backendOrigin() {
  const configured = vscode.workspace.getConfiguration('managedLabs69').inspect<string>('backendOrigin')?.globalValue ?? 'http://127.0.0.1:3076';
  const url = new URL(configured);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash) throw new Error('Use a loopback backend origin in User settings.');
  return url.origin;
}
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('managedLabs69.open', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') { void vscode.window.showErrorMessage('Open a saved .md, .txt or .ts document in a trusted workspace.'); return; }
    const folder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    if (!folder || !vscode.workspace.isTrusted) { void vscode.window.showErrorMessage('A trusted workspace folder is required.'); return; }
    const origin = backendOrigin(); const owner = randomUUID(); const documentId = randomUUID(); const review = new Lab69HostReview();
    const panel = vscode.window.createWebviewPanel('managedLabs69', 'Managed Labs 69 Review', vscode.ViewColumn.Beside,
      { enableScripts: true, localResourceRoots: [], retainContextWhenHidden: false });
    let disposed = false; let active: { correlationId: string; controller: AbortController; runId?: string } | null = null;
    let pending: { correlationId: string; base: Lab69Context } | null = null;
    const post = (message: unknown) => { if (!disposed) void panel.webview.postMessage(message); };
    async function api(path: string, body?: unknown, signal?: AbortSignal) {
      const response = await fetch(`${origin}/api/c69/${path}`, { method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Lab-Owner': owner },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }), ...(signal ? { signal } : {}) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message ?? `Backend HTTP ${response.status}`); return data;
    }
    async function cleanup(run: { correlationId: string; runId?: string }) {
      try { const found = run.runId ? { id: run.runId } : await api(`correlations/${run.correlationId}`, undefined, AbortSignal.timeout(3000));
        await api(`runs/${found.id}/cancel`, {}, AbortSignal.timeout(3000));
        const until = Date.now() + 8000;
        for (;;) { const state = await api(`runs/${found.id}`, undefined, AbortSignal.timeout(3000));
          if (state.state !== 'running') { post({ type: 'cleanup', correlationId: run.correlationId, text: `Cleanup: ${state.cleanup}; state ${state.state}.` }); return; }
          if (Date.now() > until) break; await delay(150);
        }
        post({ type: 'cleanup', correlationId: run.correlationId, text: 'Remote cleanup remains unconfirmed.' });
      } catch { post({ type: 'cleanup', correlationId: run.correlationId, text: 'Transport failed; remote cleanup is unconfirmed.' }); }
    }
    function trackCleanup(run: { correlationId: string; runId?: string }) { const work = cleanup(run); pendingCleanup.add(work);
      void work.finally(() => pendingCleanup.delete(work)); }
    const receiver = panel.webview.onDidReceiveMessage(async input => {
      const parsed = lab69WebviewMessageSchema.safeParse(input); if (!parsed.success || disposed) return; const message = parsed.data;
      if (message.type === 'cancel') { if (!active || active.correlationId !== message.correlationId) return;
        review.cancel(message.correlationId); active.controller.abort('local-cancel'); trackCleanup(active); return; }
      if (message.type === 'apply') {
        if (!pending || pending.correlationId !== message.correlationId) return;
        try { if (!vscode.workspace.isTrusted) throw new Error('Workspace trust was not granted.');
          await allowedDocument(folder.uri.fsPath, editor.document.uri.fsPath);
          const current = documentSnapshot(documentId, editor.document.version, editor.document.getText());
          const patch = review.apply(pending.base, current, message.correlationId, vscode.workspace.isTrusted);
          const version = editor.document.version;
          const applied = await editor.edit(builder => {
            if (editor.document.version !== version) throw new Error('Document changed before edit.');
            builder.replace(new vscode.Range(editor.document.positionAt(0), editor.document.positionAt(editor.document.getText().length)), patch.replacement);
          });
          pending = null; post({ type: 'applied', correlationId: message.correlationId, text: applied ? 'Reviewed patch applied to the editor buffer.' : 'VS Code rejected the edit after a document change.' });
        } catch (error) { post({ type: 'error', correlationId: message.correlationId, text: error instanceof Error ? error.message : 'Patch rejected.' }); }
        return;
      }
      if (active) { post({ type: 'error', correlationId: message.correlationId, text: 'One active run is allowed.' }); return; }
      const run = { correlationId: message.correlationId, controller: new AbortController() } as { correlationId: string; controller: AbortController; runId?: string };
      active = run; pending = null;
      try { if (!vscode.workspace.isTrusted) throw new Error('Trusted workspace required.');
        await allowedDocument(folder.uri.fsPath, editor.document.uri.fsPath);
        const base = documentSnapshot(documentId, editor.document.version, editor.document.getText()); review.begin(message.correlationId);
        let state = await api('runs', { correlationId: message.correlationId, context: base, mode: message.mode, scenario: 'normal' }, run.controller.signal);
        run.runId = state.id; let lastSeq = 0;
        while (review.accepts(message.correlationId)) {
          for (const event of state.events as { seq: number; type: string; text: string }[]) if (event.seq > lastSeq) {
            lastSeq = event.seq; post({ type: event.type, correlationId: message.correlationId, text: event.text }); }
          if (state.state !== 'running') break;
          await delay(150, undefined, { signal: run.controller.signal }); state = await api(`runs/${run.runId}`, undefined, run.controller.signal);
        }
        if (review.accepts(message.correlationId) && state.state === 'completed' && state.patch) {
          const patch = lab69PatchSchema.parse(state.patch); if (review.final(message.correlationId, patch)) {
            pending = { correlationId: message.correlationId, base }; post({ type: 'patch', correlationId: message.correlationId, text: patch.replacement }); }
        } else if (review.accepts(message.correlationId)) { review.cancel(message.correlationId);
          post({ type: 'error', correlationId: message.correlationId, text: `Run ${state.state}; cleanup ${state.cleanup}.` }); }
      } catch (error) { review.cancel(message.correlationId); trackCleanup(run);
        post({ type: 'error', correlationId: message.correlationId, text: error instanceof Error ? error.message : 'Transport failure.' });
      } finally { if (active?.correlationId === message.correlationId) active = null; }
    });
    panel.onDidDispose(() => { disposed = true; receiver.dispose(); review.dispose(); if (active) { active.controller.abort('disposed'); trackCleanup(active); } pending = null; });
    const nonce = randomBytes(18).toString('base64');
    panel.webview.html = `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';"><style nonce="${nonce}">body{font:16px system-ui;padding:18px}button{font:inherit;margin:5px;padding:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head><body><h1>Review active document</h1><p>The trusted host supplies explicit context. Review the proposed text before applying.</p><button id="offline">Start guided</button><button id="live">Start live (billed)</button><button id="cancel">Cancel</button><button id="apply">Apply reviewed patch</button><pre id="evidence"></pre><script nonce="${nonce}">const vscode=acquireVsCodeApi();let correlationId=null;let busy=false;const output=document.getElementById('evidence');for(const mode of ['offline','live'])document.getElementById(mode).onclick=()=>{if(busy)return;busy=true;for(const id of ['offline','live'])document.getElementById(id).disabled=true;correlationId=crypto.randomUUID();output.textContent='';vscode.postMessage({type:'start',correlationId,mode});};for(const type of ['cancel','apply'])document.getElementById(type).onclick=()=>{if(correlationId)vscode.postMessage({type,correlationId});};window.addEventListener('message',event=>{if(event.data.correlationId!==correlationId)return;if(['patch','error','cleanup','applied'].includes(event.data.type)){busy=false;for(const id of ['offline','live'])document.getElementById(id).disabled=false;}output.textContent+='\\n'+event.data.type+': '+event.data.text;});</script></body></html>`;
    context.subscriptions.push(panel, receiver);
  }));
}
export async function deactivate() { await Promise.allSettled([...pendingCleanup]); }
