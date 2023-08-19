import { EditorView } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import createTheme from '@uiw/codemirror-themes';

const rawTheme = {
  '&': {
    color: '#000',
    boxSizing: 'border-box',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    height: 'auto',
    overflow: 'hidden',
    border: '1px solid var(--chakra-colors-gray-700)',
    backgroundColor: '--var(--chakra-colors-gray-900)',
  },
  '&.cm-focused': {
    outline: '1px solid #38A169 !important',
    outlineOffset: '-1px',
  },
  '.cm-cursor': {
    borderLeft: '1px solid #000',
  },
  '.cm-placeholder': {
    color: '#4e5057',
    lineHeight: '30px',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-linenumber': {
    display: 'none',
  },
  '.cm-content': {
    minHeight: '30px',
    height: '30px',
    padding: '0',
    boxSizing: 'border-box',
    margin: 'auto',
    verticalAlign: 'middle',
  },
  '.cm-content, .cm-gutter': { minHeight: '30px' },
  '.cm-scrollbar': {
    display: 'none',
  },
  '.cm-scroller': {
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
  },
  '.cm-activeLineGutter': {
    display: 'none',
  },
  '.cm-line': {
    paddingLeft: '10px',
    paddingRight: '10px',
    minHeight: '30px',
    height: '30px',
    boxSizing: 'border-box',
    lineHeight: '1.8',
  },
};

const rawThemeDark = {
  ...rawTheme,
  '&': {
    ...rawTheme['&'],
    border: '1px solid var(--chakra-colors-gray-700)',
  },
};

const rawThemeLight = {
  ...rawTheme,
  '&': {
    ...rawTheme['&'],
    border: '1px solid white',
  },
  '.cm-activeLine': {
    backgroundColor: 'white',
  },
};

const baseThemeDark = EditorView.theme(rawThemeDark);
const baseThemeLight = EditorView.theme(rawThemeLight);

const cmThemeDark = createTheme({
  theme: 'dark',
  settings: {
    background: '#171923',
    foreground: 'white',
    caret: 'white',
    selection: '#5e7aa3',
    selectionMatch: '#036dd626',
    lineHighlight: '#171923',

    gutterBackground: '#fff',
    gutterForeground: '#8a919966',
  },
  styles: [{ tag: t.moduleKeyword, color: '#c678dd' }],
});

const cmThemeLight = createTheme({
  theme: 'light',
  settings: {
    background: '#fff',
    foreground: 'black',
    caret: 'black',
    selection: '#b3d7fe',
    selectionMatch: '#036dd626',

    gutterBackground: '#fff',
    gutterForeground: '#8a919966',
  },
  styles: [{ tag: t.moduleKeyword, color: '#c678dd' }],
});

export {
  baseThemeDark,
  baseThemeLight,
  cmThemeDark,
  cmThemeLight,
  rawTheme,
  rawThemeDark,
  rawThemeLight,
};
