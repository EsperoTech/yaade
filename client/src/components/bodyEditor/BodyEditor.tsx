import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { IconButton, Select, useColorMode, useToast } from '@chakra-ui/react';
import { html } from '@codemirror/lang-html';
import { xml } from '@codemirror/lang-xml';
import {
  defaultHighlightStyle,
  HighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { tags } from '@lezer/highlight';
import CodeMirror from '@uiw/react-codemirror';
import { useState } from 'react';
import React from 'react';

import { useGlobalState } from '../../state/GlobalState';
import { beautifyBody, errorToast } from '../../utils';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { json } from '../../utils/codemirror/lang-json';
import { getSelectedEnv } from '../../utils/store';
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
  const globalState = useGlobalState();
  const collections = globalState.collections.get({ noproxy: true });
  const currentRequest = globalState.currentRequest.get({ noproxy: true });
  const requestCollection = collections.find(
    (c) => c.id === currentRequest?.collectionId,
  );
  const selectedEnv = requestCollection ? getSelectedEnv(requestCollection) : null;
  const customHighlight = HighlightStyle.define([
    {
      tag: tags.moduleKeyword,
      cursor: 'help',
    },
  ]);

  const extensions = [
    cursorTooltipBaseTheme,
    wordHover(selectedEnv?.data),
    syntaxHighlighting(customHighlight),
  ];
  if (colorMode === 'light') {
    extensions.push(syntaxHighlighting(defaultHighlightStyle));
  }
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

export default React.memo(BodyEditor);
