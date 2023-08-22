import './Markdown.css';

import { CheckIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import { IconButton, useColorMode } from '@chakra-ui/react';
import { markdown } from '@codemirror/lang-markdown';
import CodeMirror from '@uiw/react-codemirror';
import { useCallback, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Editor from '../../editor';
import styles from './OverviewTab.module.css';

type OverviewTabProps = {
  description: string;
  setDescription: (description: string) => void;
};

type OverviewTabState = {
  rawDescription: string;
  isEditDescription: boolean;
};

export default function OverviewTab({ description, setDescription }: OverviewTabProps) {
  const [state, setState] = useState<OverviewTabState>({
    rawDescription: '',
    isEditDescription: false,
  });
  const { colorMode } = useColorMode();
  const theme = colorMode === 'dark' ? 'dark' : 'light';
  const extensions = [markdown()];

  function handleEditDescriptionClicked() {
    setState({ ...state, isEditDescription: true, rawDescription: description });
  }

  function handleCancelEditDescriptionClicked() {
    setState({ ...state, isEditDescription: false, rawDescription: '' });
  }

  function handleSaveDescriptionClicked() {
    setDescription(state.rawDescription);
    setState({ ...state, isEditDescription: false });
  }

  function setRawDescription(rawDescription: string) {
    setState({ ...state, rawDescription });
  }

  return (
    <div className={styles.root}>
      {/* {state.isEditDescription ? (
        <CodeMirror
          onChange={setRawDescription}
          extensions={extensions}
          theme={colorMode}
          value={state.rawDescription ?? ''}
          style={{ height: '100%' }}
        />
      ) : (
        <ReactMarkdown className={`markdown-body--${theme}`} remarkPlugins={[remarkGfm]}>
          {description}
        </ReactMarkdown>
      )} */}
      {state.isEditDescription ? (
        <span className={styles.btn}>
          <IconButton
            icon={<CheckIcon />}
            variant="ghost"
            colorScheme="green"
            aria-label="Save description"
            onClick={handleSaveDescriptionClicked}
          />
          <IconButton
            icon={<CloseIcon />}
            variant="ghost"
            colorScheme="red"
            aria-label="Cancel edit description"
            onClick={handleCancelEditDescriptionClicked}
          />
        </span>
      ) : (
        <span className={styles.btn}>
          <IconButton
            icon={<EditIcon />}
            variant="ghost"
            aria-label="Edit description"
            onClick={handleEditDescriptionClicked}
          />
        </span>
      )}
    </div>
  );
}
