import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { tags } from '@lezer/highlight';

const singleLine = EditorState.transactionFilter.of((tr) =>
  tr.newDoc.lines > 1 ? [] : tr,
);

const helpCursor = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: tags.moduleKeyword,
      cursor: 'help',
    },
  ]),
);

export { helpCursor, singleLine };
