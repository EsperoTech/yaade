import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { IconButton, Select, useColorMode, useToast } from '@chakra-ui/react';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';
import xmlFormat from 'xml-formatter';

import { beautifyBody, errorToast } from '../../utils';
import styles from './BodyEditor.module.css';

type BodyEditorProps = {
  content: string;
  setContent: any;
};

type BodyEditorState = {
  contentType: string;
};

function BodyEditor({ content, setContent }: BodyEditorProps) {
  const [state, setState] = useState<BodyEditorState>({
    contentType: 'application/json',
  });
  const { colorMode } = useColorMode();
  const toast = useToast();

  const extensions = [];
  if (state.contentType === 'application/json') {
    extensions.push(json());
  } else if (state.contentType === 'application/xml') {
    extensions.push(xml());
  } else if (state.contentType === 'text/html') {
    extensions.push(html());
  }

  function handleBeautifyClick() {
    try {
      const beautifiedBody = beautifyBody(content, state.contentType);
      setContent(beautifiedBody);
    } catch (e) {
      errorToast('Could not format body.', toast);
    }
  }

  return (
    <>
      <div className={styles.menu}>
        <Select
          size="xs"
          width="150px"
          onChange={(e) => setState({ ...state, contentType: e.target.value })}
          value={state.contentType}
          outline="none"
        >
          <option value="application/json">application/json</option>
          <option value="application/xml">application/xml</option>
          <option value="text/html">text/html</option>
          <option value="text/plain">text/plain</option>
          <option value="none">none</option>
        </Select>
        <div className={styles.iconBar}>
          <IconButton
            aria-label="beautify-content"
            isRound
            variant="ghost"
            size="xs"
            disabled={
              !['application/json', 'application/xml', 'text/html'].includes(
                state.contentType,
              )
            }
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
          onChange={(value) => {
            setContent(value);
          }}
          extensions={extensions}
          theme={colorMode}
          value={content}
          style={{ height: '100%' }}
        />
      </div>
    </>
  );
}

export default BodyEditor;
