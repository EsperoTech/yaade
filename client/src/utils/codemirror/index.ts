import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { tags } from '@lezer/highlight';

import KVRow from '../../model/KVRow';

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

function getParamsFromUri(uri: string, params?: Array<KVRow>): Array<KVRow> {
  const paramString = uri.split('?')[1];
  if (!paramString) {
    return params?.filter((param) => param.isEnabled === false) ?? [];
  }

  const uriParams = paramString.split('&').map((kv) => {
    const [k, ...v] = kv.split('='); // ...v with v.join('=') handle cases where the value contains '='
    return {
      key: k,
      value: v.join('='),
    };
  });

  if (!params) {
    return uriParams;
  }

  const newParams: KVRow[] = [];

  let indexEnabledParams = 0;
  for (const [_, param] of params.entries()) {
    if (param.isEnabled === false) {
      newParams.push(param);
    } else {
      const uriParam = uriParams[indexEnabledParams];
      if (!uriParam) {
        console.warn('params and URI params out of sync (enabled params > URI params)');
        newParams.push({ key: '', value: '' });
      } else {
        newParams.push(uriParam);
      }
      indexEnabledParams++;
    }
  }

  if (uriParams.length > indexEnabledParams) {
    console.warn('params and URI params out of sync (URI params > enabled params)');
  }
  // add remaining URI params to newParams in case they go out of sync
  for (let i = indexEnabledParams; i < uriParams.length; i++) {
    newParams.push(uriParams[i]);
  }

  return newParams;
}

function getUriFromParams(uri: string, params: Array<KVRow>): string {
  let newUri = uri;
  if (!newUri.includes('?')) {
    newUri += '?';
  }
  const base = newUri.split('?')[0];
  let searchParams = '';
  for (let i = 0; i < params.length; i++) {
    if (params[i].key === '' && params[i].value === '') {
      continue;
    }
    if (i !== 0) searchParams += '&';
    searchParams += `${params[i].key}=${params[i].value}`;
  }
  if (searchParams === '') {
    return base;
  }
  return `${base}?${searchParams}`;
}

export {
  getParamsFromUri,
  getUriFromParams,
  helpCursor,
  singleLineExtension,
  singleLineSetupOptions,
};
