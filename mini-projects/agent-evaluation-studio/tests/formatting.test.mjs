import {test} from 'node:test';
import assert from 'node:assert/strict';
import {answerPreview} from '../src/answer-preview.mjs';
import {highlightAnswerCode} from '../src/answer-code.mjs';

test('history previews read as text rather than Markdown notation',()=>{
 const source='# Result subtype\n\nThe **result subtype** is `success`.\n\n- Check the final event.\n\n```python\nprint("ok")\n```';
 const preview=answerPreview(source);
 assert.match(preview,/Result subtype The result subtype is success/);
 assert.match(preview,/Code example/);
 assert.doesNotMatch(preview,/[#*`]/);
});

test('code colouring escapes generated HTML before rendering',()=>{
 const result=highlightAnswerCode('<script>alert(1)</script>','text');
 assert.equal(result.language,'Plain text');
 assert.doesNotMatch(result.html,/<script>/);
 assert.match(result.html,/&lt;script&gt;/);
 const python=highlightAnswerCode('print("ok")','python');
 assert.equal(python.language,'python');
 assert.match(python.html,/hljs-/);
});
