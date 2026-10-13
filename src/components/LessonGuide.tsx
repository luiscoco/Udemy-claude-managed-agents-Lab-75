import type { ReactNode } from 'react';
import { selectGuide } from '../lib/presentation';
import { CodeBlock } from './CodeBlock';

function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)]+\)|`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) return /^(https?:\/\/|\/[^/]|#)/.test(link[2]!) ? <a key={i} href={link[2]}>{link[1]}</a> : link[1];
    if (part.startsWith('`')) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return part;
  });
}
export function LessonGuide({ markdown, lessonId }: { markdown: string; lessonId: number }) {
  const selected = selectGuide(markdown, lessonId);
  if (!selected) return <p role="alert">No unambiguous detailed guide is available for this lesson.</p>;
  const lines = selected.split(/\r?\n/); const blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i]!; const key = i;
    if (!line.trim()) { i++; continue; }
    const fence = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      const language = fence[2]!.trim(); const code: string[] = []; i++;
      const end = new RegExp(`^\\s*${fence[1]![0]}{${fence[1]!.length},}\\s*$`);
      while (i < lines.length && !end.test(lines[i]!)) code.push(lines[i++]!);
      i++; blocks.push(<CodeBlock key={key} code={code.join('\n')} label={language || 'Guide code'} />); continue;
    }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) { const Tag = `h${Math.min(heading[1]!.length + 1, 6)}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; blocks.push(<Tag key={key}>{inline(heading[2]!)}</Tag>); i++; continue; }
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line); const items: ReactNode[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/).test(lines[i]!)) {
        items.push(<li key={i}>{inline(lines[i++]!.replace(/^\s*(?:[-*]|\d+\.)\s+/, ''))}</li>);
      }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>); continue;
    }
    if (line.startsWith('|') && /^\|[\s:|-]+\|$/.test(lines[i + 1] ?? '')) {
      const cells = (row: string) => row.split('|').slice(1, -1).map((cell) => cell.trim());
      const headers = cells(line); i += 2; const rows: string[][] = [];
      while (i < lines.length && lines[i]!.startsWith('|')) rows.push(cells(lines[i++]!));
      blocks.push(<div className="table-scroll" key={key}><table><thead><tr>{headers.map((cell, j) => <th scope="col" key={j}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.map((row, j) => <tr key={j}>{row.map((cell, k) => <td key={k}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>); continue;
    }
    blocks.push(<p key={key}>{inline(line)}</p>); i++;
  }
  return <div className="lesson-guide">{blocks}</div>;
}
