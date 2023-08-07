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
import CodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

import { beautifyBody, errorToast } from '../../utils';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { json } from '../../utils/codemirror/lang-json';
import { getSelectedEnv } from '../../utils/store';
import styles from './BodyEditor.module.css';

type BodyEditorProps = {
  content: string;
  setContent: any;
  selectedEnv: any;
};

type BodyEditorState = {
  contentType: string;
};

const customHighlight = HighlightStyle.define([
  {
    tag: tags.moduleKeyword,
    cursor: 'help',
  },
]);

function BodyEditor({ content, setContent, selectedEnv }: BodyEditorProps) {
  const [state, setState] = useState<BodyEditorState>({
    contentType: 'application/json',
  });
  const { colorMode } = useColorMode();
  const toast = useToast();

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
      <div className={styles.container} ref={ref} />
    </>
  );
}

export default BodyEditor;
