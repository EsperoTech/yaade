import { useColorMode } from '@chakra-ui/react';
import { drawSelection, EditorView } from '@codemirror/view';
import ReactCodeMirror from '@uiw/react-codemirror';

import { helpCursor, singleLine } from '../../utils/codemirror';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { yaade } from '../../utils/codemirror/lang-yaade';
import {
  cmThemeDark,
  cmThemeLight,
  rawTheme,
  rawThemeDark,
} from '../../utils/codemirror/themes';

const theme = {
  ...rawThemeDark,
  '.cm-placeholder': {
    ...rawTheme['.cm-placeholder'],
    lineHeight: '38px',
  },
  '.cm-content': {
    ...rawTheme['.cm-content'],
    minHeight: '38px',
    height: '38px',
  },
  '.cm-line': {
    ...rawTheme['.cm-line'],
    lineHeight: '2.4',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
};

const themeDark = EditorView.theme({
  ...theme,
  '&': {
    ...theme['&'],
    borderRadius: '20px',
    border: '1px solid var(--chakra-colors-gray-700)',
  },
});

const themeLight = EditorView.theme({
  ...theme,
  '&': {
    ...theme['&'],
    borderRadius: '20px',
    border: '1px solid #EDF2F7',
  },
  '.cm-activeLine': {
    backgroundColor: 'white',
  },
});

type SingleRowEditorProps = {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  selectedEnv?: any;
};

export default function SingleRowEditor({
  value,
  onChange,
  placeholder,
  selectedEnv,
}: SingleRowEditorProps) {
  const { colorMode } = useColorMode();
  const extensions = [
    cursorTooltipBaseTheme,
    wordHover(selectedEnv?.data),
    helpCursor,
    singleLine,
    yaade(colorMode),
  ];

  const eventHandlers = EditorView.domEventHandlers({
    paste(event) {
      if (!event.target || !event.clipboardData) {
        return;
      }
      // differenciates between initial and synthetic event to prevent infinite loop
      if (!event.isTrusted) {
        return;
      }
      event.preventDefault();

      const text = event.clipboardData.getData('text/plain');
      const sanitized = text.replace(/(\r\n|\n|\r)/gm, '');

      const data = new DataTransfer();
      data.setData('text/plain', sanitized);
      const sanitizedEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clipboardData: data,
      });

      event.target?.dispatchEvent(sanitizedEvent);
    },
  });

  return (
    <ReactCodeMirror
      value={value}
      onChange={onChange}
      extensions={[
        colorMode === 'light' ? themeLight : themeDark,
        ...extensions,
        drawSelection(),
        eventHandlers,
      ]}
      theme={colorMode === 'light' ? cmThemeLight : cmThemeDark}
      style={{ height: '30px' }}
      placeholder={placeholder}
      indentWithTab={false}
      basicSetup={false}
    />
  );
}
