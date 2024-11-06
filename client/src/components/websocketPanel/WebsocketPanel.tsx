import {
  Box,
  Button,
  IconButton,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
} from '@chakra-ui/react';
import { history } from '@codemirror/commands';
import { drawSelection } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import { Dispatch, useCallback, useEffect, useMemo, useRef } from 'react';
import { VscSave } from 'react-icons/vsc';

import Collection from '../../model/Collection';
import KVRow from '../../model/KVRow';
import { CurrentWebsocketRequest, WebsocketRequest } from '../../model/Request';
import { findCollection } from '../../state/collections';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import { cn } from '../../utils';
import {
  getParamsFromUri,
  getUriFromParams,
  helpCursor,
  singleLineExtension,
  singleLineSetupOptions,
} from '../../utils/codemirror';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { yaade } from '../../utils/codemirror/lang-yaade';
import {
  baseThemeDark,
  baseThemeLight,
  cmThemeDark,
  cmThemeLight,
} from '../../utils/codemirror/themes';
import { getSelectedEnv } from '../../utils/store';
import BodyTextEditor from '../bodyEditor/BodyTextEditor';
import OverviewTab from '../collectionPanel/OverviewTab';
import KVEditor from '../kvEditor';
import styles from './WebsocketPanel.module.css';

type WebsocketPanelProps = {
  currentRequest: CurrentWebsocketRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  collections: Collection[];
};

function WebsocketPanel({
  currentRequest,
  dispatchCurrentRequest,
  collections,
}: WebsocketPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();

  const requestCollection = useMemo(() => {
    return findCollection(collections, currentRequest?.collectionId);
  }, [collections, currentRequest?.collectionId]);
  const selectedEnv = useMemo(() => {
    return requestCollection ? getSelectedEnv(requestCollection) : null;
  }, [requestCollection]);

  const setUri = useCallback(
    (uri: string) => {
      const params = getParamsFromUri(uri, currentRequest.data.params);
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { uri, params },
      });
    },
    [currentRequest.data.params, dispatchCurrentRequest],
  );

  const { setContainer } = useCodeMirror({
    container: ref.current,
    onChange: (value: string) => setUri(value),
    extensions: [
      yaade(colorMode),
      colorMode === 'light' ? baseThemeLight : baseThemeDark,
      singleLineExtension,
      history(),
      wordHover(selectedEnv?.data),
      helpCursor,
      cursorTooltipBaseTheme,
      drawSelection(),
    ],
    theme: colorMode === 'light' ? cmThemeLight : cmThemeDark,
    value: currentRequest.data?.uri ?? '',
    style: { height: '100%' },
    placeholder: 'URL',
    indentWithTab: false,
    basicSetup: singleLineSetupOptions,
  });

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref, setContainer]);

  const setParams = useCallback(
    (params: Array<KVRow>) => {
      const enabledParams = params.filter((param) => param.isEnabled !== false);
      const uri = getUriFromParams(currentRequest.data.uri ?? '', enabledParams);
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { params, uri },
      });
    },
    [currentRequest.data.uri, dispatchCurrentRequest],
  );

  function handleSubmit() {
    console.log('submit');
  }

  function handleSaveRequestClick() {
    console.log('save request');
  }

  function handleSendButtonClick() {
    console.log('send');
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <form className={styles.container} onSubmit={handleSubmit}>
          <div className={styles.cm} ref={ref} />
          <button
            className={cn(styles, 'button', [colorMode])}
            disabled={currentRequest.data?.uri === ''}
            type="submit"
          >
            {'CONNECT'}
          </button>
        </form>
        <IconButton
          aria-label="save-request-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          onClick={handleSaveRequestClick}
          disabled={!currentRequest.isChanged}
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
          <Tab>Parameters</Tab>
          <Tab>Headers</Tab>
          <Tab>Message</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel>
            <OverviewTab
              description={currentRequest?.data?.description ?? ''}
              setDescription={(description) =>
                dispatchCurrentRequest({
                  type: CurrentRequestActionType.PATCH_DATA,
                  data: { description },
                })
              }
            />
          </TabPanel>
          <TabPanel>
            <KVEditor
              name="params"
              kvs={
                currentRequest.data.params ??
                getParamsFromUri(currentRequest.data.uri ?? '')
              }
              setKvs={setParams}
              canDisableRows={true}
              hasEnvSupport={'BOTH'}
              env={selectedEnv}
            />
          </TabPanel>
          <TabPanel>
            <KVEditor
              name="headers"
              kvs={currentRequest.data.headers ?? []}
              setKvs={(headers: any) =>
                dispatchCurrentRequest({
                  type: CurrentRequestActionType.PATCH_DATA,
                  data: { headers },
                })
              }
              canDisableRows={true}
              hasEnvSupport={'BOTH'}
              env={selectedEnv}
            />
          </TabPanel>
          <TabPanel h="calc(100% - 1rem)">
            <BodyTextEditor
              content={currentRequest.data.message ?? ''}
              setContent={(message: string) =>
                dispatchCurrentRequest({
                  type: CurrentRequestActionType.PATCH_DATA,
                  data: { message },
                })
              }
              selectedEnv={selectedEnv}
              contentType="text/plain"
            />
            <Button onClick={handleSendButtonClick}>Send</Button>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default WebsocketPanel;
