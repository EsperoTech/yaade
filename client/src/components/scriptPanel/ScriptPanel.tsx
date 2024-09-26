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
import React, {
  Dispatch,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  VscDebugPause,
  VscHorizontalRule,
  VscKebabVertical,
  VscPlay,
  VscSave,
  VscSplitVertical,
} from 'react-icons/vsc';

import api from '../../api';
import Collection from '../../model/Collection';
import { CurrentScript, ScriptResult } from '../../model/Script';
import {
  CollectionsAction,
  CollectionsActionType,
  findCollection,
} from '../../state/collections';
import { CurrentScriptAction, CurrentScriptActionType } from '../../state/currentScript';
import {
  BASE_PATH,
  cn,
  errorToast,
  successToast,
  validateCronExpression,
} from '../../utils';
import { useKeyPress } from '../../utils/useKeyPress';
import styles from './ScriptPanel.module.css';

const theme = EditorView.theme({
  '&': {
    height: 'calc(100% - 5rem)',
  },
});

type ScriptPanelProps = {
  currentScript: CurrentScript;
  collections: Collection[];
  dispatchCurrentScript: Dispatch<CurrentScriptAction>;
  dispatchCollections: React.Dispatch<CollectionsAction>;
  forceSetScriptResult: React.MutableRefObject<(result: ScriptResult) => void>;
};

function ScriptPanel({
  currentScript,
  collections,
  dispatchCurrentScript,
  dispatchCollections,
  forceSetScriptResult,
}: ScriptPanelProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const extensions = [javascript(), theme, indentUnit.of('    ')];
  const [isRunning, setIsRunning] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const script = useMemo(
    () => currentScript.data.script ?? '',
    [currentScript.data.script],
  );

  const envNames = useMemo(() => {
    const collection = findCollection(collections, currentScript.collectionId);
    if (!collection) return [];
    return Object.keys(collection.data?.envs ?? {});
  }, [collections, currentScript.collectionId]);

  const setScript = useCallback(
    (s: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { script: s },
      });
    },
    [dispatchCurrentScript],
  );

  const setName = useCallback(
    (name: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { name },
      });
    },
    [dispatchCurrentScript],
  );

  const setCronExpression = useCallback(
    (cronExpression: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { cronExpression },
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

  const saveScript = useCallback(
    async (script: CurrentScript) => {
      try {
        const response = await fetch(BASE_PATH + 'api/scripts', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(script),
        });
        if (response.status === 200) {
          // skip
        } else if (response.status === 400) {
          const body = await response.json();
          const message = body.message;
          throw new Error(message);
        } else {
          throw new Error();
        }

        dispatchCollections({
          type: CollectionsActionType.PATCH_SCRIPT_DATA,
          id: script.id,
          data: script.data,
        });
        dispatchCurrentScript({
          type: CurrentScriptActionType.SET_IS_CHANGED,
          isChanged: false,
        });
        successToast('Script was saved.', toast);
      } catch (e: any) {
        errorToast('The script could not be saved. ' + e.message, toast);
      }
    },
    [dispatchCollections, dispatchCurrentScript, toast],
  );

  const handleSaveScript = useCallback(async () => {
    saveScript(currentScript);
  }, [currentScript, saveScript]);

  const setEnabled = useCallback(
    (enabled: boolean) => {
      saveScript({
        ...currentScript,
        data: {
          ...currentScript.data,
          enabled,
          lastRun: enabled ? Date.now() : undefined,
        },
      });
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { enabled },
      });
    },
    [currentScript, dispatchCurrentScript, saveScript],
  );

  const setSelectedEnvName = useCallback(
    (selectedEnvName: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { selectedEnvName },
      });
    },
    [dispatchCurrentScript],
  );

  const handleRunClick = useCallback(async () => {
    try {
      if (isRunning) return;
      setIsRunning(true);
      const envName = currentScript.data.selectedEnvName;
      const res = await api.runScript(currentScript, envName);
      if (res.status !== 200) throw new Error();
      const newResult = await res.json();
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { results: [newResult, ...(currentScript.data.results ?? [])] },
      });
      dispatchCollections({
        type: CollectionsActionType.PATCH_SCRIPT_DATA,
        id: currentScript.id,
        data: { results: [newResult, ...(currentScript.data.results ?? [])] },
      });
      if (forceSetScriptResult.current) {
        forceSetScriptResult.current(newResult);
      }
      successToast('Run finished', toast);
    } catch (e) {
      console.error(e);
      errorToast('Failed to run script. Check the console for errors.', toast);
    } finally {
      setIsRunning(false);
    }
  }, [
    currentScript,
    dispatchCollections,
    dispatchCurrentScript,
    forceSetScriptResult,
    isRunning,
    toast,
  ]);

  useKeyPress(handleSaveScript, 's', true);

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex', width: '100%' }}>
        <input
          className={cn(styles, 'input', [colorMode])}
          type="text"
          placeholder="Name"
          value={currentScript.data.name ?? ''}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className={cn(styles, 'button', [colorMode])}
          onClick={handleRunClick}
          disabled={isRunning}
        >
          {isRunning ? <Spinner size="sm" /> : 'RUN'}
        </button>
        <IconButton
          aria-label="save-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          disabled={!currentScript.isChanged}
          onClick={handleSaveScript}
        />
      </div>
      <div className={styles.menu}>
        <div className={styles.cronPanel}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <Text fontSize="sm" fontWeight="bold" color="gray.500" mr="2">
                Cron Configuration
              </Text>
              <Tooltip
                label="Configure the script as a cron job to run periodically on the server. Visit the docs for more information."
                fontSize="md"
              >
                <QuestionOutlineIcon color="gray.500" />
              </Tooltip>
            </div>
            <div style={{ display: 'flex' }}>
              <Input
                placeholder="* * * * *"
                w="120px"
                mr="2"
                size="sm"
                colorScheme="green"
                backgroundColor={colorMode === 'light' ? 'white' : undefined}
                value={currentScript.data.cronExpression ?? ''}
                isInvalid={
                  !validateCronExpression(currentScript.data.cronExpression ?? '')
                }
                onChange={(e) => setCronExpression(e.target.value)}
              />
              <Select
                size="sm"
                w="150px"
                onChange={(e) => setSelectedEnvName(e.target.value)}
                disabled={envNames.length === 0}
                value={currentScript.data.selectedEnvName ?? 'No Env Selected'}
              >
                <option key="NO_ENV" value="NO_ENV">
                  NO_ENV
                </option>
                {envNames.length > 0 ? (
                  envNames
                    .filter((e) => e !== '')
                    .map((envName) => (
                      <option key={envName} value={envName}>
                        {envName}
                      </option>
                    ))
                ) : (
                  <option value="">No Envs</option>
                )}
              </Select>
              <IconButton
                aria-label="pause-button"
                icon={<VscDebugPause />}
                variant="ghost"
                colorScheme="red"
                size="sm"
                ml="2"
                disabled={!currentScript.data.enabled}
                onClick={() => setEnabled(false)}
              />
              <IconButton
                aria-label="save-button"
                icon={<VscPlay />}
                colorScheme="green"
                variant="ghost"
                size="sm"
                ml="2"
                disabled={currentScript.data.enabled}
                onClick={() => setEnabled(true)}
              />
            </div>
          </div>
        </div>
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
    </Box>
  );
}

export default ScriptPanel;
