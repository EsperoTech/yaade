import { Box, useToast } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Dispatch, useCallback, useContext, useMemo } from 'react';
import { VscSave } from 'react-icons/vsc';

import { UserContext } from '../../context';
import KVRow from '../../model/KVRow';
import { AuthData, CurrentRestRequest, RestRequest } from '../../model/Request';
import { RestResponse } from '../../model/Response';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import {
  currentRestRequestToRequest,
  errorToast,
  getParamsFromUri,
  getUriFromParams,
} from '../../utils';
import { getSelectedEnvs } from '../../utils/store';
import AuthTab from '../authTab';
import BodyEditor from '../bodyEditor';
import OverviewTab from '../collectionPanel/OverviewTab';
import Editor from '../editor';
import GenerateCodeTab from '../generateCodeTab';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

type RequestPanelProps = {
  currentRequest: CurrentRestRequest;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
  sendRequest(request: RestRequest, envName?: string, n?: number): Promise<RestResponse>;
  saveOnSend: (request: RestRequest) => Promise<void>;
  handleSaveRequestClick: () => Promise<void>;
  selectedEnvData: Record<string, string>;
};

function RequestPanel({
  currentRequest,
  dispatchCurrentRequest,
  sendRequest,
  saveOnSend,
  handleSaveRequestClick,
  selectedEnvData,
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

      let requestToSend = currentRestRequestToRequest(currentRequest);

      const envName = getSelectedEnvs()[requestToSend.collectionId];

      const response = await sendRequest(requestToSend, envName);

      dispatchCurrentRequest({
        type: CurrentRequestActionType.PATCH_DATA,
        data: { response },
      });

      const newRequest: RestRequest = {
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
          envData={selectedEnvData}
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
              envData={selectedEnvData}
            />
          </TabPanel>
          <TabPanel>
            <KVEditor
              name="headers"
              kvs={headers}
              setKvs={setHeaders}
              canDisableRows={true}
              hasEnvSupport={'BOTH'}
              envData={selectedEnvData}
            />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor
              content={currentRequest.data.body}
              formDataContent={currentRequest.data.formDataBody}
              setContent={setBody}
              setFormDataContent={setFormDataBody}
              selectedEnvData={selectedEnvData}
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
              selectedEnvData={selectedEnvData}
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
            <GenerateCodeTab request={currentRequest} selectedEnvData={selectedEnvData} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default RequestPanel;
