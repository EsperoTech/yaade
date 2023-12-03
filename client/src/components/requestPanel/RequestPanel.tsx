import { Box, useToast } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Dispatch, useCallback, useContext, useMemo } from 'react';
import { VscSave } from 'react-icons/vsc';

import { UserContext } from '../../context';
import KVRow from '../../model/KVRow';
import Request, { CurrentRequest } from '../../model/Request';
import Response from '../../model/Response';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import { currentRequestToRequest, errorToast } from '../../utils';
import { getSelectedEnvs } from '../../utils/store';
import BodyEditor from '../bodyEditor';
import OverviewTab from '../collectionPanel/OverviewTab';
import Editor from '../editor';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

const defaultParam = {
  key: '',
  value: '',
};

function shouldAppendNewRow(params: Array<KVRow>): boolean {
  if (params.length === 0) return true;
  const { key, value } = params[params.length - 1];
  return key !== '' || value !== '';
}

function getParamsFromUri(uri: string): Array<KVRow> {
  try {
    const paramString = uri.split('?')[1];
    const params = paramString.split('&').map((kv) => {
      const [k, ...v] = kv.split('=');
      return {
        key: k,
        value: v.join('='),
      };
    });
    if (shouldAppendNewRow(params)) {
      params.push(defaultParam);
    }
    return params;
  } catch (e) {
    return [defaultParam];
  }
}

type RequestPanelProps = {
  currentRequest: CurrentRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  sendRequest(request: Request, envName?: string, n?: number): Promise<Response>;
  saveOnSend: (request: Request) => Promise<void>;
  handleSaveRequestClick: () => void;
  selectedEnv: Record<string, string>;
};

function RequestPanel({
  currentRequest,
  dispatchCurrentRequest,
  sendRequest,
  saveOnSend,
  handleSaveRequestClick,
  selectedEnv,
}: RequestPanelProps) {
  const toast = useToast();
  const { user } = useContext(UserContext);

  const params = useMemo(
    () => getParamsFromUri(currentRequest.data.uri ?? ''),
    [currentRequest.data.uri],
  );

  const headers = useMemo(
    () =>
      currentRequest.data.headers && currentRequest.data.headers.length !== 0
        ? currentRequest.data.headers
        : [{ key: '', value: '' }],
    [currentRequest.data.headers],
  );

  const setMethod = useCallback(
    (method: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { method },
      }),
    [dispatchCurrentRequest],
  );

  const setUri = useCallback(
    (uri: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { uri },
      }),
    [dispatchCurrentRequest],
  );

  const setHeaders = useCallback(
    (headers: Array<KVRow>) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { headers },
      }),
    [dispatchCurrentRequest],
  );

  const setBody = useCallback(
    (body: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { body },
      }),
    [dispatchCurrentRequest],
  );

  const setResponseScript = useCallback(
    (responseScript: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { responseScript },
      }),
    [dispatchCurrentRequest],
  );

  const setRequestScript = useCallback(
    (requestScript: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { requestScript },
      }),
    [dispatchCurrentRequest],
  );

  const setDescription = useCallback(
    (description: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { description },
      }),
    [dispatchCurrentRequest],
  );

  const setUriFromParams = useCallback(
    (params: Array<KVRow>) => {
      try {
        let uri = currentRequest.data.uri ?? '';
        if (!uri.includes('?')) {
          uri += '?';
        }
        const base = uri.split('?')[0];
        let searchParams = '';
        for (let i = 0; i < params.length; i++) {
          if (params[i].key === '' && params[i].value === '') {
            continue;
          }
          if (i !== 0) searchParams += '&';
          searchParams += `${params[i].key}=${params[i].value}`;
        }
        if (searchParams === '') {
          setUri(base);
        } else {
          setUri(`${base}?${searchParams}`);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [currentRequest.data.uri, setUri],
  );

  async function handleSendButtonClick() {
    try {
      if (currentRequest.isLoading) {
        dispatchCurrentRequest({
          type: CurrentRequestActionType.SET_IS_LOADING,
          isLoading: false,
        });
        return;
      }

      dispatchCurrentRequest({
        type: CurrentRequestActionType.SET_IS_LOADING,
        isLoading: true,
      });

      let requestToSend = currentRequestToRequest(currentRequest);

      const envName = getSelectedEnvs()[requestToSend.collectionId];

      const response = await sendRequest(requestToSend, envName);

      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { response },
      });

      const newRequest: Request = {
        ...currentRequest,
        data: { ...currentRequest.data, response: response },
      };

      if (user?.data?.settings?.saveOnSend) {
        await saveOnSend(newRequest);
      }
    } catch (e: any) {
      errorToast(e.message, toast, 5000);
    }

    dispatchCurrentRequest({
      type: CurrentRequestActionType.SET_IS_LOADING,
      isLoading: false,
    });
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <UriBar
          uri={currentRequest.data.uri ?? ''}
          setUri={setUri}
          method={currentRequest.data.method ?? ''}
          setMethod={setMethod}
          handleSendButtonClick={handleSendButtonClick}
          isLoading={currentRequest.isLoading}
          env={selectedEnv}
        />
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
          <Tab>Body</Tab>
          <Tab>Request Script</Tab>
          <Tab>Response Script</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel>
            <OverviewTab
              description={currentRequest?.data?.description ?? ''}
              setDescription={setDescription}
            />
          </TabPanel>
          <TabPanel>
            <KVEditor
              name="params"
              kvs={params}
              setKvs={setUriFromParams}
              hasEnvSupport={'BOTH'}
              env={selectedEnv}
            />
          </TabPanel>
          <TabPanel>
            <KVEditor
              name="headers"
              kvs={headers}
              setKvs={setHeaders}
              hasEnvSupport={'BOTH'}
              env={selectedEnv}
            />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor
              content={currentRequest.data.body ?? ''}
              setContent={setBody}
              selectedEnv={selectedEnv}
            />
          </TabPanel>
          <TabPanel h="100%">
            <Editor
              content={currentRequest.data.requestScript ?? ''}
              setContent={setRequestScript}
            />
          </TabPanel>
          <TabPanel h="100%">
            <Editor
              content={currentRequest.data.responseScript ?? ''}
              setContent={setResponseScript}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default RequestPanel;
