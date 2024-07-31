import { useColorMode } from '@chakra-ui/react';
import { EditorState } from '@codemirror/state';
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
    singleLineExtension,
  ];

  return (
    <ReactCodeMirror
      value={value}
      onChange={onChange}
      extensions={[
        colorMode === 'light' ? themeLight : themeDark,
        ...extensions,
        drawSelection(),
      ]}
      theme={colorMode === 'light' ? cmThemeLight : cmThemeDark}
      style={{ height: '30px' }}
      placeholder={placeholder}
      indentWithTab={false}
      basicSetup={false}
    />
  );
}
