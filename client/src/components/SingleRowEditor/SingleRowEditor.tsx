import { useColorMode } from '@chakra-ui/react';
import { history } from '@codemirror/commands';
import { drawSelection, EditorView } from '@codemirror/view';
import ReactCodeMirror from '@uiw/react-codemirror';

import {
  helpCursor,
  singleLineExtension,
  singleLineSetupOptions,
} from '../../utils/codemirror';
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
    yaade(colorMode),
    singleLineExtension,
    drawSelection(),
    colorMode === 'light' ? themeLight : themeDark,
    history(),
  ];

  // {
  //   lineNumbers?: boolean;
  //   highlightActiveLineGutter?: boolean;
  //   foldGutter?: boolean;
  //   dropCursor?: boolean;
  //   allowMultipleSelections?: boolean;
  //   indentOnInput?: boolean;
  //   bracketMatching?: boolean;
  //   closeBrackets?: boolean;
  //   autocompletion?: boolean;
  //   rectangularSelection?: boolean;
  //   crosshairCursor?: boolean;
  //   highlightActiveLine?: boolean;
  //   highlightSelectionMatches?: boolean;
  //   closeBracketsKeymap?: boolean;
  //   searchKeymap?: boolean;
  //   foldKeymap?: boolean;
  //   completionKeymap?: boolean;
  //   lintKeymap?: boolean;
  //   /**
  //    * Facet for overriding the unit by which indentation happens. Should be a string consisting either entirely of spaces or entirely of tabs. When not set, this defaults to 2 spaces
  //    * https://codemirror.net/docs/ref/#language.indentUnit
  //    * @default 2
  //    */
  //   tabSize?: number;

  return (
    <ReactCodeMirror
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={colorMode === 'light' ? cmThemeLight : cmThemeDark}
      style={{ maxWidth: '100%', width: '100%', overflow: 'hidden' }}
      placeholder={placeholder}
      indentWithTab={false}
      basicSetup={singleLineSetupOptions}
    />
  );
}
