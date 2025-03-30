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
import OverviewTab from '../collectionPanel/OverviewTab';
import styles from './ScriptPanel.module.css';
import ScriptTab from './ScriptTab';
import SettingsTab from './SettingsTab';

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
  const [isRunning, setIsRunning] = useState(false);

  const envNames = useMemo(() => {
    const collection = findCollection(collections, currentScript.collectionId);
    if (!collection) return [];
    return Object.keys(collection.data?.envs ?? {});
  }, [collections, currentScript.collectionId]);

  const setName = useCallback(
    (name: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { name },
      });
    },
    [dispatchCurrentScript],
  );

  const setDescription = useCallback(
    (description: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { description },
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
      <Tabs
        isLazy
        colorScheme="green"
        mt="1"
        display="flex"
        flexDirection="column"
        maxHeight="100%"
        h="100%"
        mb="4"
      >
        <TabList>
          <Tab>Description</Tab>
          <Tab>Script</Tab>
          <Tab>Settings</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel h="100%">
            <OverviewTab
              description={currentScript?.data?.description ?? ''}
              setDescription={setDescription}
            />
          </TabPanel>
          <TabPanel h="100%">
            <ScriptTab
              currentScript={currentScript}
              dispatchCurrentScript={dispatchCurrentScript}
            />
          </TabPanel>
          <TabPanel h="100%">
            <SettingsTab
              currentScript={currentScript}
              envNames={envNames}
              dispatchCurrentScript={dispatchCurrentScript}
              saveScript={saveScript}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default ScriptPanel;
