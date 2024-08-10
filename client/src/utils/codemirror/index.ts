import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { tags } from '@lezer/highlight';

const helpCursor = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: tags.moduleKeyword,
      cursor: 'help',
    },
  ]),
);

const singleLineExtension = EditorState.transactionFilter.of((tr) =>
  tr.newDoc.lines > 1
    ? [
        tr,
        {
          changes: {
            from: 0,
            to: tr.newDoc.length,
            insert: tr.newDoc.sliceString(0, undefined, ' '),
          },
          sequential: true,
        },
      ]
    : [tr],
);

const singleLineSetupOptions = {
  lineNumbers: false,
  highlightActiveLineGutter: false,
  foldGutter: false,
  dropCursor: true,
  allowMultipleSelections: false,
  indentOnInput: false,
  bracketMatching: false,
  closeBrackets: true,
  autocompletion: false,
  rectangularSelection: false,
  crosshairCursor: true,
  highlightActiveLine: true,
  highlightSelectionMatches: false,
  closeBracketsKeymap: false,
  searchKeymap: false,
  foldKeymap: false,
  completionKeymap: false,
  lintKeymap: false,
  tabSize: 2,
};

export { helpCursor, singleLineExtension, singleLineSetupOptions };
