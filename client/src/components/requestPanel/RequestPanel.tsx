import { Box, Input, Select, useDisclosure, useToast } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { MutableRefObject, useContext, useRef, useState } from 'react';
import { VscSave } from 'react-icons/vsc';

import { UserContext } from '../../context';
import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import Response from '../../model/Response';
import {
  getEnv,
  getEnvVar,
  patchCurrentRequestData,
  setEnvVar,
  useGlobalState,
  writeRequestToCollections,
} from '../../state/GlobalState';
import {
  appendHttpIfNoProtocol,
  BASE_PATH,
  createMessageId,
  errorToast,
  getMinorVersion,
  kvRowsToMap,
  parseResponse,
  successToast,
} from '../../utils';
import interpolate from '../../utils/interpolate';
import { executeRequestScript, executeResponseScript } from '../../utils/script';
import { getSelectedEnvs } from '../../utils/store';
import { useKeyPress } from '../../utils/useKeyPress';
import BasicModal from '../basicModal';
import BodyEditor from '../bodyEditor';
import Editor from '../editor';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

type NewReqFormState = {
  collectionId: number;
  name: string;
};

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
  currentRequest: Request;
  isExtInitialized: MutableRefObject<boolean>;
  extVersion: MutableRefObject<string | undefined>;
  openExtModal: () => void;
};

function RequestPanel({
  currentRequest,
  isExtInitialized,
  extVersion,
  openExtModal,
}: RequestPanelProps) {
  const [newReqForm, setNewReqForm] = useState<NewReqFormState>({
    collectionId: -1,
    name: '',
  });
  const globalState = useGlobalState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef(null);
  const toast = useToast();
  const { user } = useContext(UserContext);

  useKeyPress(handleSaveRequestClick, 's', true);

  const collections = globalState.collections.get({ noproxy: true });

  if (collections.length > 0 && newReqForm.collectionId === -1) {
    setNewReqForm({ ...newReqForm, collectionId: collections[0].id });
  }

  function onCloseClear() {
    setNewReqForm({
      collectionId: -1,
      name: '',
    });
    onClose();
  }

  const params = getParamsFromUri(currentRequest.data.uri);

  const headers =
    currentRequest.data.headers && currentRequest.data.headers.length !== 0
      ? currentRequest.data.headers
      : [{ key: '', value: '' }];

  const setMethod = (method: string) => {
    patchCurrentRequestData({ method });
    globalState.requestChanged.set(true);
  };

  const setUri = (uri: string) => {
    patchCurrentRequestData({ uri });
    globalState.requestChanged.set(true);
  };

  const setHeaders = (headers: Array<KVRow>) => {
    patchCurrentRequestData({ headers });
    globalState.requestChanged.set(true);
  };

  const setBody = (body: string) => {
    patchCurrentRequestData({ body });
    globalState.requestChanged.set(true);
  };

  const setResponseScript = (responseScript: string) => {
    patchCurrentRequestData({ responseScript });
    globalState.requestChanged.set(true);
  };

  const setRequestScript = (requestScript: string) => {
    patchCurrentRequestData({ requestScript });
    globalState.requestChanged.set(true);
  };

  function setUriFromParams(params: Array<KVRow>) {
    try {
      let uri = currentRequest.data.uri;
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
      console.log(e);
    }
  }

  async function _sendSaveRequest(method: string, body: any): Promise<any> {
    const response = await fetch(BASE_PATH + 'api/request', {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.status !== 200) throw new Error();
    return response;
  }

  async function saveRequest(): Promise<void> {
    await _sendSaveRequest('PUT', currentRequest);
  }

  async function saveNewRequest(body: any): Promise<Request> {
    const response = await _sendSaveRequest('POST', body);
    return (await response.json()) as Request;
  }

  async function handleSaveNewRequestClick() {
    try {
      const body = {
        collectionId: newReqForm.collectionId,
        type: 'REST',
        data: { ...currentRequest.data, name: newReqForm.name },
      };

      const newRequest = await saveNewRequest(body);

      writeRequestToCollections(newRequest);
      globalState.currentRequest.set(newRequest);

      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      errorToast('The request could be not created', toast);
    }
  }

  async function handleSaveRequestClick() {
    try {
      if (currentRequest.id === -1 && currentRequest.collectionId === -1) {
        onOpen();
        return;
      } else {
        await saveRequest();
        writeRequestToCollections(currentRequest);
        globalState.requestChanged.set(false);
        successToast('The request was successfully saved.', toast);
      }
    } catch (e) {
      console.log(e);
      errorToast('The request could not be saved.', toast);
    }
  }

  async function handleSendButtonClick() {
    try {
      if (globalState.requestLoading.get()) {
        globalState.requestLoading.set(false);
        return;
      }

      globalState.requestLoading.set(true);

      let req = {
        ...currentRequest,
        data: { ...currentRequest.data, response: null },
      } as Request;
      const envName = getSelectedEnvs()[req.collectionId];

      const response = await sendRequest(req, envName);

      const newRequest: any = {
        ...req,
        data: {
          ...req.data,
          response: response,
        },
      };

      globalState.currentRequest.set(newRequest);
      if (user?.data?.settings?.saveOnSend) {
        await saveRequestAndCollection(newRequest);
      }
    } catch (e: any) {
      errorToast(e.message, toast, 5000);
    }

    globalState.requestLoading.set(false);
  }

  async function saveRequestAndCollection(request: Request) {
    let response = await fetch(BASE_PATH + 'api/request', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (response.status !== 200)
      throw new Error(`Failed to save request [Status: ${response.status}]]`);
    writeRequestToCollections(request);

    const i = globalState.collections.findIndex(
      (c: any) => c.id.get() === request.collectionId,
    );
    if (i === -1) return;
    const collection = globalState.collections[i].get({ noproxy: true });

    response = await fetch(BASE_PATH + 'api/collection', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(collection),
    });
    if (response.status !== 200)
      throw new Error(`Failed to save collection [Status: ${response.status}]]`);
  }

  async function sendRequest(
    request: Request,
    envName?: string,
    n?: number,
  ): Promise<Response> {
    if (n && n >= 5) {
      throw Error('Exec loop detected in request script');
    }

    let proxy = 'ext';
    const env = getEnv(request.collectionId, envName);
    if (env) {
      proxy = env.proxy;
    }

    if (request.data.requestScript) {
      if (proxy === 'ext' && getMinorVersion(extVersion.current) < 3) {
        throw Error(`Request scripts are not supported in this version of the extension. 
          Please update to the latest version or remove the request script.`);
      }
      await doRequestScript(request, envName, n);
    }

    let response = null;
    switch (proxy) {
      case 'server':
        response = await sendRequestToServer(request, envName);
        break;
      case 'ext':
        if (!isExtInitialized.current) {
          openExtModal();
          throw Error('Extension not initialized');
        }
        response = await sendRequestToExtension(request, envName);
        break;
      default:
        throw Error('Unknown proxy');
    }

    if (request.data.responseScript) {
      doResponseScript(request, response, envName);
    }

    return response;
  }

  async function doRequestScript(request: Request, envName?: string, n?: number) {
    const requestScript = request.data.requestScript;
    if (!requestScript) {
      return;
    }
    // NOTE: cannot pass state on top level because it does not use most current state
    const set = (key: string, value: string) =>
      setEnvVar(request.collectionId, envName)(globalState, key, value);
    const get = (key: string): string =>
      getEnvVar(request.collectionId, envName)(globalState, key);
    const exec = async (requestId: number, envName?: string) => {
      const request = globalState.collections
        .get({ noproxy: true })
        .flatMap((c) => c.requests)
        .find((r) => r.id === requestId);
      if (!request) {
        throw Error(`Request with id ${requestId} not found`);
      }
      if (!n) n = 0;
      return await sendRequest(request, envName, n + 1);
    };
    await executeRequestScript(request, requestScript, set, get, exec, toast, envName);
  }

  function doResponseScript(request: Request, response: Response, envName?: string) {
    // NOTE: cannot pass state on top level because it does not use most current state
    const set = (key: string, value: string) =>
      setEnvVar(request.collectionId, envName)(globalState, key, value);
    const get = (key: string): string =>
      getEnvVar(request.collectionId, envName)(globalState, key);
    executeResponseScript(
      response,
      request?.data?.responseScript,
      set,
      get,
      toast,
      request.id,
      envName,
    );
  }

  async function sendRequestToExtension(
    request: Request,
    envName?: string,
    n?: number,
  ): Promise<Response> {
    if (n && n >= 5) {
      throw Error('Exec loop detected in request script');
    }
    return new Promise((resolve, reject) => {
      const messageId = createMessageId(request.id);

      function handleMessage(event: any) {
        if (event?.data?.type === 'receive-response' && event?.data?.response?.err) {
          reject(new Error(event.data.response.err));
        } else if (
          event.data &&
          event.data.type === 'receive-response' &&
          event.data.response.metaData.messageId === messageId
        ) {
          window.removeEventListener('message', handleMessage);
          resolve(parseResponse(event.data.response));
        }
      }

      window.addEventListener('message', handleMessage);

      setTimeout(() => {
        // Remove the event listener if the Promise is not resolved after 5 seconds
        window.removeEventListener('message', handleMessage);
        reject(new Error('Timeout wating for response from: ' + request.id));
      }, 5000);

      // TODO: check if this mutates the original request object
      let interpolatedRequest = { ...request };
      if (envName) {
        const collection = globalState.collections
          .get({ noproxy: true })
          .find((c) => c.id === request.collectionId);
        if (!collection) {
          throw Error('Collection not found for id: ' + request.collectionId);
        }
        const selectedEnv = collection.data?.envs?.[envName];
        const selectedEnvData = selectedEnv?.data ?? {};
        const interpolateResult = interpolate(request, selectedEnvData);
        interpolatedRequest = interpolateResult.result;
      }

      const url = appendHttpIfNoProtocol(interpolatedRequest.data.uri);

      const headers = kvRowsToMap(interpolatedRequest.data.headers);

      const options: any = { headers, method: interpolatedRequest.data.method };
      if (interpolatedRequest.data.body) {
        options['body'] = interpolatedRequest.data.body;
      }

      window.postMessage(
        {
          url,
          type: 'send-request',
          options: options,
          metaData: {
            messageId,
            envName,
            isRequestScript: n ?? 0 > 0,
          },
        },
        '*',
      );
    });
  }

  async function sendRequestToServer(
    request: Request,
    envName?: string,
  ): Promise<Response> {
    if (envName) {
      const collection = globalState.collections
        .get({ noproxy: true })
        .find((c) => c.id === request.collectionId);
      if (!collection) {
        throw Error('Collection not found for id: ' + request.collectionId);
      }
      const selectedEnv = collection.data?.envs?.[envName];
      const selectedEnvData = selectedEnv?.data ?? {};
      const interpolateResult = interpolate(request, selectedEnvData);
      request = interpolateResult.result;
    }
    return fetch(BASE_PATH + 'api/invoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request, envName }),
    })
      .then((res) => {
        if (res.status !== 200) throw new Error(`Server error. Status: ${res.status}`);
        return res.json();
      })
      .then((resBody) => {
        if (resBody.error) throw new Error(resBody.error);
        return parseResponse(resBody);
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
          isLoading={globalState.requestLoading.get()}
        />
        <IconButton
          aria-label="save-request-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          onClick={handleSaveRequestClick}
          disabled={!globalState.requestChanged.get()}
        />
      </div>

      <Tabs
        colorScheme="green"
        mt="1"
        display="flex"
        flexDirection="column"
        maxHeight="100%"
        h="100%"
        mb="4"
      >
        <TabList>
          <Tab>Parameters</Tab>
          <Tab>Headers</Tab>
          <Tab>Body</Tab>
          <Tab>Request Script</Tab>
          <Tab>Response Script</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel>
            <KVEditor name="params" kvs={params} setKvs={setUriFromParams} />
          </TabPanel>
          <TabPanel>
            <KVEditor name="headers" kvs={headers} setKvs={setHeaders} />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor content={currentRequest.data.body ?? ''} setContent={setBody} />
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
      <BasicModal
        isOpen={isOpen}
        onClose={onCloseClear}
        initialRef={initialRef}
        heading="Save a new request"
        onClick={handleSaveNewRequestClick}
        isButtonDisabled={newReqForm.name === '' || newReqForm.collectionId === -1}
        buttonText="Save"
        buttonColor="green"
      >
        <Input
          placeholder="Name"
          w="100%"
          borderRadius={20}
          colorScheme="green"
          value={newReqForm.name}
          onChange={(e) => setNewReqForm({ ...newReqForm, name: e.target.value })}
          ref={initialRef}
          mb="4"
        />
        <Select
          borderRadius={20}
          value={newReqForm.collectionId}
          onChange={(e) =>
            setNewReqForm({ ...newReqForm, collectionId: Number(e.target.value) })
          }
        >
          {collections.map((collection) => (
            <option key={`collection-dropdown-${collection.id}`} value={collection.id}>
              {collection.data.name}
            </option>
          ))}
        </Select>
      </BasicModal>
    </Box>
  );
}

export default RequestPanel;
