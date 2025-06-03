import { SpinnerIcon, StarIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  IconButton,
  Select,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { history } from '@codemirror/commands';
import { drawSelection } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import { Dispatch, useCallback, useEffect, useMemo, useRef } from 'react';
import { VscSave } from 'react-icons/vsc';

import api from '../../api';
import Collection, { Environment } from '../../model/Collection';
import KVRow from '../../model/KVRow';
import { CurrentWebsocketRequest, WebsocketRequest } from '../../model/Request';
import {
  CollectionsAction,
  CollectionsActionType,
  findCollection,
} from '../../state/collections';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import {
  beautifyBody,
  cn,
  errorToast,
  getParamsFromUri,
  getUriFromParams,
  successToast,
} from '../../utils';
import {
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
import { useKeyPress } from '../../utils/useKeyPress';
import BodyTextEditor from '../bodyEditor/BodyTextEditor';
import OverviewTab from '../collectionPanel/OverviewTab';
import KVEditor from '../kvEditor';
import styles from './WebsocketPanel.module.css';

type WebsocketPanelProps = {
  currentRequest: CurrentWebsocketRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  dispatchCollections: Dispatch<CollectionsAction>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  onConnect: () => void;
  onWrite: (message: string) => void;
  onDisconnect: () => void;
  selectedEnvData: Record<string, string>;
};

function WebsocketPanel({
  currentRequest,
  dispatchCurrentRequest,
  dispatchCollections,
  connectionStatus,
  onConnect,
  onWrite,
  onDisconnect,
  selectedEnvData,
}: WebsocketPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  const toast = useToast();

  async function handleSaveRequestClick(preventSuccessToast = false) {
    try {
      if (currentRequest.id === -1 && currentRequest.collectionId === -1) {
        return;
      }
      await api.updateRequest(currentRequest);
      dispatchCollections({
        type: CollectionsActionType.PATCH_REQUEST_DATA,
        id: currentRequest.id,
        data: { ...currentRequest.data },
      });
      dispatchCurrentRequest({
        type: CurrentRequestActionType.SET_IS_CHANGED,
        isChanged: false,
      });
      if (!preventSuccessToast) {
        successToast('The request was successfully saved.', toast);
      }
    } catch (e) {
      console.error(e);
      errorToast('The request could not be saved.', toast);
    }
  }

  useKeyPress(handleSaveRequestClick, 's', true);

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
      wordHover(selectedEnvData),
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

  function handleSendButtonClick() {
    onWrite(currentRequest.data.message ?? '');
  }

  function setContentType(contentType: string) {
    dispatchCurrentRequest({
      type: CurrentRequestActionType.PATCH_DATA,
      data: { contentType },
    });
  }

  function handleBeautifyClick() {
    try {
      if (!currentRequest.data.message) return;
      const beautifiedBody = beautifyBody(
        currentRequest.data.message ?? '',
        currentRequest.data.contentType ?? 'text/plain',
      );
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { message: beautifiedBody },
      });
    } catch (e) {
      errorToast('Could not format body.', toast);
    }
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <div className={styles.container}>
          <div className={styles.cm} ref={ref} />
          <button
            className={cn(styles, 'button', [colorMode])}
            disabled={currentRequest.data?.uri === ''}
            onClick={connectionStatus === 'disconnected' ? onConnect : onDisconnect}
          >
            {connectionStatus === 'disconnected' ? (
              'CONNECT'
            ) : connectionStatus === 'connected' ? (
              'DISCONNECT'
            ) : (
              <Spinner size="sm" />
            )}
          </button>
        </div>
        <IconButton
          aria-label="save-request-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          onClick={() => handleSaveRequestClick()}
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
              selectedEnvData={selectedEnvData}
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
              selectedEnvData={selectedEnvData}
            />
          </TabPanel>
          <TabPanel h="calc(100% - 4rem)">
            <div className={styles.iconBar}>
              <Select
                size="xs"
                width="150px"
                onChange={(e) => setContentType(e.target.value)}
                value={currentRequest.data.contentType ?? 'text/plain'}
                outline="none"
                mb="3"
              >
                <option value="application/json">application/json</option>
                <option value="application/xml">application/xml</option>
                <option value="text/html">text/html</option>
                <option value="text/plain">text/plain</option>
                <option value="application/x-www-form-urlencoded">
                  application/x-www-form-urlencoded
                </option>
                <option value="multipart/form-data">multipart/form-data</option>
                <option value="none">none</option>
              </Select>
              <IconButton
                aria-label="beautify-content"
                isRound
                variant="ghost"
                size="xs"
                disabled={currentRequest.data.message?.length === 0}
                onClick={handleBeautifyClick}
                icon={<StarIcon />}
              />
            </div>
            <BodyTextEditor
              content={currentRequest.data.message ?? ''}
              setContent={(message: string) =>
                dispatchCurrentRequest({
                  type: CurrentRequestActionType.PATCH_DATA,
                  data: { message },
                })
              }
              selectedEnvData={selectedEnvData}
              contentType={currentRequest.data.contentType ?? 'text/plain'}
            />
            <Button
              disabled={connectionStatus !== 'connected'}
              onClick={handleSendButtonClick}
            >
              Send
            </Button>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default WebsocketPanel;
