// Copy/display only sanitized evidence. Never pass environment values to UI components.
export function redact(text: string): string {
  return text.replace(/\b(?:sk-ant-|sk-)[\w-]+/g, '[REDACTED]')
    .replace(/((?:api[_-]?key|access[_-]?token|authorization|password|secret)\s*["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1"[REDACTED]"')
    .replace(/\bBearer\s+[\w.+/-]+/gi, 'Bearer [REDACTED]');
}

// A standalone guide must identify its lesson too; unknown/missing sections fail closed.
export function selectGuide(markdown: string, lessonId: number): string | undefined {
  const lines = markdown.replace(/^\uFEFF/, '').split(/\r?\n/);
  const sections: { id: number; start: number }[] = [];
  let fence: string | undefined;
  lines.forEach((line, start) => {
    const delimiter = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (delimiter) {
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length && /^\s*(`{3,}|~{3,})\s*$/.test(line)) fence = undefined;
      return;
    }
    if (fence) return;
    const heading = /^#{1,6}\s+(?:.*?\b)?(?:Lesson|Lab|Concept|Exercise)\b\s*(?:#|:)?\s*(\d+)\b/i.exec(line)
      ?? /^#{1,6}\s+(\d{1,2})(?:[.:\s-]|$)/.exec(line);
    if (heading) sections.push({ id: Number(heading[1]), start });
  });
  if (fence) return undefined; // An unfinished fence can swallow the next lesson boundary.
  const matches = sections.filter(({ id }) => id === lessonId);
  if (matches.length !== 1) return undefined;
  const index = sections.indexOf(matches[0]!);
  return lines.slice(matches[0]!.start, sections[index + 1]?.start).join('\n');
}
