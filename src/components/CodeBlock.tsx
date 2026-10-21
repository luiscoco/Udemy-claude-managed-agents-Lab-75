import { useState } from 'react';
import { redact } from '../lib/presentation';

export function syntaxTokens(line: string) {
  return line.split(/(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b(?:import|from|export|const|let|function|return|async|await|if|else|throw|new|type|interface|class|true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g).map((token, i) => {
    const kind = token.startsWith('//') ? 'comment' : /^["'`]/.test(token) ? 'string' : /^\d/.test(token) ? 'number' : /^(import|from|export|const|let|function|return|async|await|if|else|throw|new|type|interface|class|true|false|null|undefined)$/.test(token) ? 'keyword' : undefined;
    return kind ? <span className={`syntax-${kind}`} key={i}>{token}</span> : token;
  });
}
export function CodeBlock({ code, label = 'Code', lineNumbers = true, syntax = false, highlight }: { code: string; label?: string; lineNumbers?: boolean; syntax?: boolean; highlight?: { start: number; end: number } }) {
  const [feedback, setFeedback] = useState('');
  const safe = redact(code);
  async function copy() {
    try { await navigator.clipboard.writeText(safe); setFeedback('Copied.'); }
    catch { setFeedback('Copy unavailable. Select the text to copy it manually.'); }
  }
  return <div className="code-block"><div className="code-toolbar"><span>{label}</span>
    <button className="button-secondary" type="button" aria-label={`Copy ${label}`} onClick={() => void copy()}>Copy</button><span role="status">{feedback}</span></div>
    <pre aria-label={label}><code>{lineNumbers ? safe.split('\n').map((line, i) => <span data-code-line={i + 1} className={`code-line${highlight && i + 1 >= highlight.start && i + 1 <= highlight.end ? ' code-narration-highlight' : ''}${highlight?.start === i + 1 ? ' code-highlight-start' : ''}${highlight?.end === i + 1 ? ' code-highlight-end' : ''}`} key={i}><span className="line-number" aria-hidden="true">{i + 1}</span><span>{syntax ? syntaxTokens(line || '\u00a0') : line || '\u00a0'}</span>{'\n'}</span>) : safe}</code></pre>
  </div>;
}
