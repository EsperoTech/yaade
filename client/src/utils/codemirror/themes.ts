import { EditorView } from '@codemirror/view';
import createTheme from '@uiw/codemirror-themes';

let rawTheme = {
  '&': {
    color: '#000',
    boxSizing: 'border-box',
    border: '1px solid var(--chakra-colors-gray-700)',
    backgroundColor: '--var(--chakra-colors-gray-900)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    height: 'auto', // Set height to auto
    overflow: 'hidden', // Hide overflowed content
  },
  '&.cm-focused': {
    outline: '1px solid #38A169 !important',
    outlineOffset: '-1px',
  },
  '.cm-activeLine': {
    // minHeight: '100%',
    // height: '100%',
    // transparency: '100%',
    // 'background-color': '#171923 !important',
  },
  '.cm-focused .cm-selectionBackground, ::selection': {
    // backgroundColor: 'red !important',
  },
  '.cm-line::selection': {
    // backgroundColor: 'red !important',
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
    // backgroundColor: '#171923',
    margin: 'auto',
    verticalAlign: 'middle',
    // caretColor: 'white !important',
    // color: 'white',
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
    // backgroundColor: '#171923',
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'start',
    lineHeight: '1.8', // Adjust line height for better vertical alignment
  },
};

let baseTheme = EditorView.theme(rawTheme);

const cmTheme = createTheme({
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
  styles: [],
});

export { baseTheme, cmTheme, rawTheme };
