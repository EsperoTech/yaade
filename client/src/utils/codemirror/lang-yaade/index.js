import { LanguageSupport, LRLanguage } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

import { parser } from './lang';

/**
A language provider that provides yaade parsing.
*/
const yaadeLanguage = LRLanguage.define({
  name: 'json',
  parser: parser,
});
/**
Yaade language support.
*/
function yaade(colorMode) {
  // NOTE: we need to add the support extension to overwrite the default transpaent selection color
  const themeOptions = {};
  themeOptions[
    '.cm-line::selection, .cm-line > span::selection, .cm-line > span > span::selection'
  ] = {
    backgroundColor: colorMode === 'dark' ? '#5e7aa3 !important' : '#b3d7fe !important',
  };
  const themeExtension = EditorView.theme(themeOptions);
  return new LanguageSupport(yaadeLanguage, [themeExtension]);
}

export { yaade, yaadeLanguage };
