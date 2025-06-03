import { DeleteIcon, QuestionOutlineIcon, StarIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Heading,
  IconButton,
  Input,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { javascript } from '@codemirror/lang-javascript';
import { indentUnit } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import beautify from 'beautify';
import { Dispatch, useCallback, useEffect, useMemo, useRef } from 'react';
import { VscDebugPause, VscPlay } from 'react-icons/vsc';

import Collection from '../../model/Collection';
import { CurrentScript } from '../../model/Script';
import {
  CollectionsAction,
  CollectionsActionType,
  findCollection,
} from '../../state/collections';
import { CurrentScriptAction, CurrentScriptActionType } from '../../state/currentScript';
import { validateCronExpression } from '../../utils';
import { BASE_PATH, errorToast, successToast } from '../../utils';
import styles from './ScriptTab.module.css';
import SettingsTab from './SettingsTab';
type ScriptTabProps = {
  currentScript: CurrentScript;
  dispatchCurrentScript: Dispatch<CurrentScriptAction>;
};

const theme = EditorView.theme({
  '&': {
    height: 'calc(100% - 1rem)',
  },
});

export default function ScriptTab({
  currentScript,
  dispatchCurrentScript,
}: ScriptTabProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const extensions = [javascript(), theme, indentUnit.of('    ')];

  const script = useMemo(
    () => currentScript.data.script ?? '',
    [currentScript.data.script],
  );

  const setScript = useCallback(
    (s: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { script: s },
      });
    },
    [dispatchCurrentScript],
  );

  const { setContainer } = useCodeMirror({
    container: ref.current,
    onChange: (value: string) => setScript(value),
    extensions: [extensions],
    theme: colorMode,
    value: script,
    style: { height: '100%' },
  });

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref, setContainer]);

  function handleBeautifyClick() {
    try {
      const beautifiedBody = beautify(script, { format: 'js' });
      setScript(beautifiedBody);
    } catch (e) {
      errorToast('Could not format script.', toast);
    }
  }

  return (
    <div style={{ height: '100%' }}>
      <div className={styles.menu}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
          <IconButton
            aria-label="beautify-content"
            isRound
            variant="ghost"
            size="xs"
            onClick={handleBeautifyClick}
            icon={<StarIcon />}
          />
          <IconButton
            aria-label="delete-script-content"
            isRound
            variant="ghost"
            size="xs"
            disabled={script.length === 0}
            onClick={() => setScript('')}
            icon={<DeleteIcon />}
          />
        </div>
      </div>
      <div className={styles.container} ref={ref} />
    </div>
  );
}
