import { Box, useToast } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Dispatch, useCallback, useContext, useMemo } from 'react';
import { VscSave } from 'react-icons/vsc';

import { UserContext } from '../../context';
import KVRow from '../../model/KVRow';
import Request, { AuthData, CurrentRequest } from '../../model/Request';
import Response from '../../model/Response';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import { currentRequestToRequest, errorToast } from '../../utils';
import { getSelectedEnvs } from '../../utils/store';
import AuthTab from '../authTab';
import BodyEditor from '../bodyEditor';
import OverviewTab from '../collectionPanel/OverviewTab';
import Editor from '../editor';
import GenerateCodeTab from '../generateCodeTab';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

function getParamsFromUri(uri: string, params?: Array<KVRow>): Array<KVRow> {
  const paramString = uri.split('?')[1];
  if (!paramString) {
    return params?.filter((param) => param.isEnabled === false) ?? [];
  }

  const uriParams = paramString.split('&').map((kv) => {
    const [k, ...v] = kv.split('='); // ...v with v.join('=') handle cases where the value contains '='
    return {
      key: k,
      value: v.join('='),
    };
  });

  if (!params) {
    return uriParams;
  }

  const newParams: KVRow[] = [];

  let indexEnabledParams = 0;
  for (const [_, param] of params.entries()) {
    if (param.isEnabled === false) {
      newParams.push(param);
    } else {
      const uriParam = uriParams[indexEnabledParams];
      if (!uriParam) {
        console.warn('params and URI params out of sync (enabled params > URI params)');
        newParams.push({ key: '', value: '' });
      } else {
        newParams.push(uriParam);
      }
      indexEnabledParams++;
    }
  }

  if (uriParams.length > indexEnabledParams) {
    console.warn('params and URI params out of sync (URI params > enabled params)');
  }
  // add remaining URI params to newParams in case they go out of sync
  for (let i = indexEnabledParams; i < uriParams.length; i++) {
    newParams.push(uriParams[i]);
  }

  return newParams;
}

function getUriFromParams(uri: string, params: Array<KVRow>): string {
  let newUri = uri;
  if (!newUri.includes('?')) {
    newUri += '?';
  }
  const base = newUri.split('?')[0];
  let searchParams = '';
  for (let i = 0; i < params.length; i++) {
    if (params[i].key === '' && params[i].value === '') {
      continue;
    }
    if (i !== 0) searchParams += '&';
    searchParams += `${params[i].key}=${params[i].value}`;
  }
  if (searchParams === '') {
    return base;
  }
  return `${base}?${searchParams}`;
}

type RequestPanelProps = {
  currentRequest: CurrentRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  sendRequest(request: Request, envName?: string, n?: number): Promise<Response>;
  saveOnSend: (request: Request) => Promise<void>;
  handleSaveRequestClick: () => Promise<void>;
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

  const headers = useMemo(
    () =>
      currentRequest.data.headers && currentRequest.data.headers.length !== 0
        ? currentRequest.data.headers
        : [{ key: '', value: '', isEnabled: true }],
    [currentRequest.data.headers],
  );

  const contentType = useMemo(
    () => currentRequest.data.contentType ?? 'application/json',
    [currentRequest.data.contentType],
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
    (uri: string) => {
      const params = getParamsFromUri(uri, currentRequest.data.params);
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { uri, params },
      });
    },
    [currentRequest.data.params, dispatchCurrentRequest],
  );

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

  const setFormDataBody = useCallback(
    (formDataBody: Array<KVRow>) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { formDataBody },
      }),
    [dispatchCurrentRequest],
  );

  const setContentType = useCallback(
    (contentType: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { contentType },
      }),
    [dispatchCurrentRequest],
  );

  const setAuthData = useCallback(
    (authData: AuthData) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { auth: authData },
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

  const setContentTypeHeader = useCallback(
    (value: string) =>
      dispatchCurrentRequest({
        type: CurrentRequestActionType.SET_CONTENT_TYPE_HEADER,
        value,
      }),
    [dispatchCurrentRequest],
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
          <Tab>Auth</Tab>
          <Tab>Request Script</Tab>
          <Tab>Response Script</Tab>
          <Tab>Code</Tab>
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
              kvs={headers}
              setKvs={setHeaders}
              canDisableRows={true}
              hasEnvSupport={'BOTH'}
              env={selectedEnv}
            />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor
              content={currentRequest.data.body}
              formDataContent={currentRequest.data.formDataBody}
              setContent={setBody}
              setFormDataContent={setFormDataBody}
              selectedEnv={selectedEnv}
              contentType={contentType}
              setContentType={setContentType}
              setContentTypeHeader={setContentTypeHeader}
            />
          </TabPanel>
          <TabPanel h="100%">
            <AuthTab
              authData={currentRequest.data.auth}
              setAuthData={setAuthData}
              doSave={handleSaveRequestClick}
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
          <TabPanel>
            <GenerateCodeTab request={currentRequest} env={selectedEnv} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default RequestPanel;
