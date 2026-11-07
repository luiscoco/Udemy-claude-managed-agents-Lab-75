import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {highlightAnswerCode} from './answer-code.mjs';

const components={
 a({children,...props}){return <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>;},
 pre({children}){
  const codeElement=React.isValidElement(children)?children:null;
  const source=codeElement?.props?.children;
  const languageClass=codeElement?.props?.className??'';
  const languageHint=/^language-([\w+-]+)$/.exec(languageClass)?.[1]??'';
  const {html,language}=highlightAnswerCode(typeof source==='string'?source:'',languageHint);
  return <div className="answer-code-block"><div className="answer-code-label">{language}</div><pre tabIndex={0}><code className="hljs" dangerouslySetInnerHTML={{__html:html}}/></pre></div>;
 }
};

export function AnswerMarkdown({text}){
 return <div className="answer-content" aria-label="Formatted agent answer"><Markdown remarkPlugins={[remarkGfm]} components={components} disallowedElements={['img']} skipHtml>{typeof text==='string'?text:''}</Markdown></div>;
}
