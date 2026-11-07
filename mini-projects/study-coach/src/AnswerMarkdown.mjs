import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {highlightAnswerCode} from './answer-code.mjs';

const components = {
  a({children, ...props}) {
    return React.createElement('a', {...props, target: '_blank', rel: 'noopener noreferrer'}, children);
  },
  pre({children}) {
    const codeElement = React.isValidElement(children) ? children : null;
    const source = codeElement?.props?.children;
    const languageClass = codeElement?.props?.className ?? '';
    const languageHint = /^language-([\w+-]+)$/.exec(languageClass)?.[1] ?? '';
    const {html, language} = highlightAnswerCode(typeof source === 'string' ? source : '', languageHint);
    return React.createElement('div', {className: 'answer-code-block'},
      React.createElement('div', {className: 'answer-code-label'}, language),
      React.createElement('pre', {tabIndex: 0},
        React.createElement('code', {className: 'hljs', dangerouslySetInnerHTML: {__html: html}})));
  },
};

export function AnswerMarkdown({text}) {
  return React.createElement(
    'div',
    {className: 'answer-content', 'aria-label': 'Coach answer'},
    React.createElement(Markdown, {
      remarkPlugins: [remarkGfm],
      components,
      disallowedElements: ['img'],
      skipHtml: true,
      children: typeof text === 'string' ? text : '',
    }),
  );
}
