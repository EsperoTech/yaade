import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { IconButton, Select, useColorMode, useToast } from '@chakra-ui/react';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';
import xmlFormat from 'xml-formatter';

import { errorToast } from '../../utils';
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
    contentType: '',
  });
  const { colorMode } = useColorMode();
  const toast = useToast();

  const extensions = [];
  if (state.contentType === 'json') {
    extensions.push(json());
  } else if (state.contentType === 'xml') {
    extensions.push(xml());
  }

  function handleBeautifyClick() {
    try {
      if (state.contentType === 'json') {
        const beautified = JSON.stringify(JSON.parse(content), null, 2);
        setContent(beautified);
      } else if (state.contentType === 'xml') {
        const beautified = xmlFormat(content);
        setContent(beautified);
      }
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
          outline="none"
        >
          <option value="json">application/json</option>
          <option value="xml">application/xml</option>
          <option value="text">text/plain</option>
          <option value="none">none</option>
        </Select>
        <div className={styles.iconBar}>
          <IconButton
            aria-label="beautify-content"
            isRound
            variant="ghost"
            size="xs"
            disabled={!['json', 'xml'].includes(state.contentType)}
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
