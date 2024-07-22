import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { IconButton, useColorMode, useToast } from '@chakra-ui/react';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import beautify from 'beautify';
import React, { useEffect, useRef } from 'react';

import { errorToast } from '../../utils';
import styles from './Editor.module.css';

const theme = EditorView.theme({
  '&': {
    height: 'calc(100% - 1rem)',
  },
});

type EditorProps = {
  content: string;
  setContent: any;
};

function Editor({ content, setContent }: EditorProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const extensions = [javascript(), theme];

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

  function handleBeautifyClick() {
    try {
      const beautifiedBody = beautify(content, { format: 'js' });
      setContent(beautifiedBody);
    } catch (e) {
      errorToast('Could not format content.', toast);
    }
  }

  return (
    <>
      <div className={styles.menu}>
        <div className={styles.iconBar}>
          <IconButton
            aria-label="beautify-content"
            isRound
            variant="ghost"
            size="xs"
            onClick={handleBeautifyClick}
            icon={<StarIcon />}
          />
          <IconButton
            aria-label="delete-content"
            isRound
            variant="ghost"
            size="xs"
            disabled={content.length === 0}
            onClick={() => setContent('')}
            icon={<DeleteIcon />}
          />
        </div>
      </div>
      <div className={styles.container} ref={ref} />
    </>
  );
}

export default React.memo(Editor);
