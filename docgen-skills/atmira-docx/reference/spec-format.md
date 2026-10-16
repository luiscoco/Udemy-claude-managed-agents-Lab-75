# Explicit document specification

The closed spec has `title`, `kind` (`ordinary` or `incident`), `classification` (`Internal` or `Public`), an ISO `date`, and `blocks`.

Blocks are: `{type:"paragraph",text}`, `{type:"heading",level:1|2,text}`, `{type:"list",ordered:boolean,items:[text]}`, or `{type:"table",headers:[text],rows:[[text]],widths:[integer percentages]}`. Widths sum to 100 and match the header count. Tables have 2–6 columns and at most 20 rows; lists have at most 10 items; documents have at most 40 blocks. Titles use plain words/numbers/spaces. Text is literal: there is no Markdown, HTML or inline formatting grammar. XML characters are escaped by the builder.

The builder owns styles, native numbering, restarted ordered lists, repeated table headers, A4 layout, page-number footer and document properties. It emits `SPEC ERROR <path>` and exit code 2 for invalid specs. ZIP member order and timestamps are fixed so identical specs and brand files produce identical bytes.
