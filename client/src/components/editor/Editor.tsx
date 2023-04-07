import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { IconButton, useColorMode, useToast } from '@chakra-ui/react';
import { javascript } from '@codemirror/lang-javascript';
import CodeMirror from '@uiw/react-codemirror';
import beautify from 'beautify';
import React from 'react';

import { errorToast } from '../../utils';
import styles from './Editor.module.css';

type EditorProps = {
  content: string;
  setContent: any;
};

function Editor({ content, setContent }: EditorProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const extensions = [javascript()];

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
      <div className={styles.container}>
        <CodeMirror
          onChange={setContent}
          extensions={extensions}
          theme={colorMode}
          value={content}
          style={{ height: '100%' }}
        />
      </div>
    </>
  );
}

export default React.memo(Editor);
