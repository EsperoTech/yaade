import { useColorMode } from '@chakra-ui/react';
import { html } from '@codemirror/lang-html';
import { xml } from '@codemirror/lang-xml';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import { useEffect, useRef } from 'react';

import { helpCursor } from '../../utils/codemirror';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { json } from '../../utils/codemirror/lang-json';
import styles from './BodyEditor.module.css';

const theme = EditorView.theme({
  '&': {
    height: 'calc(100% - 1rem)',
  },
});

type BodyTextEditorProps = {
  content: string;
  setContent: any;
  selectedEnvData: Record<string, string>;
  contentType: string;
};

function BodyTextEditor({
  content,
  setContent,
  selectedEnvData,
  contentType,
}: BodyTextEditorProps) {
  const { colorMode } = useColorMode();

  const extensions = [
    cursorTooltipBaseTheme,
    wordHover(selectedEnvData),
    helpCursor,
    theme,
  ];
  if (colorMode === 'light') {
    extensions.push(syntaxHighlighting(defaultHighlightStyle));
  }
  if (contentType === 'application/json') {
    extensions.push(json());
  } else if (contentType === 'application/xml') {
    extensions.push(xml());
  } else if (contentType === 'text/html') {
    extensions.push(html());
  }

  const ref = useRef<HTMLDivElement>(null);

  const { setContainer } = useCodeMirror({
    container: ref.current,
    onChange: (value: string) => setContent(value),
    extensions: [extensions],
    theme: colorMode,
    value: content,
    style: { height: '100%' },
  });

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref, setContainer]);

  return (
    <>
      <div className={styles.container} ref={ref} />
    </>
  );
}

export default BodyTextEditor;
