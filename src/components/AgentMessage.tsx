import { ReadableMarkdown } from './ReadableMarkdown';
import { CodeBlock } from './CodeBlock';
import { redact } from '../lib/presentation';
import { useState } from 'react';

export function AgentMessage({ text }: { text: string }) {
  const safe = redact(text);
  const [inspect, setInspect] = useState(false);
  return <div className="agent-message">
    <ReadableMarkdown text={safe} headingOffset={3} />
    <details onToggle={event => setInspect(event.currentTarget.open)}><summary>Inspect exact agent message</summary>{inspect && <CodeBlock code={safe} label="Exact agent message" lineNumbers={false} />}</details>
  </div>;
}
