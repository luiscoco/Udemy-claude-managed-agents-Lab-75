import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import sql from 'highlight.js/lib/languages/sql';

for (const [name, grammar] of Object.entries({javascript, typescript, json, python, bash, xml, css, sql})) {
  hljs.registerLanguage(name, grammar);
}

const aliases = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', sh: 'bash', shell: 'bash', zsh: 'bash',
  html: 'xml', svg: 'xml',
};

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightAnswerCode(source, languageHint = '') {
  const code = String(source);
  const hint = String(languageHint).toLowerCase();
  const language = aliases[hint] ?? hint;
  if (code.length > 100_000 || language === 'text' || language === 'plaintext') {
    return {html: escapeHtml(code), language: 'Plain text'};
  }
  try {
    if (hljs.getLanguage(language)) {
      return {html: hljs.highlight(code, {language, ignoreIllegals: true}).value, language};
    }
    if (!hint && code.trim()) {
      const result = hljs.highlightAuto(code, ['typescript', 'javascript', 'json', 'python', 'bash', 'xml', 'css', 'sql']);
      return {html: result.value, language: result.language ?? 'Plain text'};
    }
  } catch {
    // A malformed model-generated snippet still needs to remain readable.
  }
  return {html: escapeHtml(code), language: hint || 'Plain text'};
}
