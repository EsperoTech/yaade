import { Box, Input, Select, useDisclosure, useToast } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { MutableRefObject, useContext, useRef, useState } from 'react';
import { VscSave } from 'react-icons/vsc';

import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import { useGlobalState, writeRequestToCollections } from '../../state/GlobalState';
import {
  appendHttpIfNoProtocol,
  errorToast,
  kvRowsToMap,
  successToast,
} from '../../utils';
import interpolate from '../../utils/interpolate';
import { getSelectedEnvData } from '../../utils/store';
import { useKeyPress } from '../../utils/useKeyPress';
import BasicModal from '../basicModal';
import BodyEditor from '../bodyEditor';
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
  isExtInitialized: MutableRefObject<boolean>;
  openExtModal: () => void;
};

function RequestPanel({ isExtInitialized, openExtModal }: RequestPanelProps) {
  const [newReqForm, setNewReqForm] = useState<NewReqFormState>({
    collectionId: -1,
    name: '',
  });
  const globalState = useGlobalState();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef(null);
  const toast = useToast();

  useKeyPress(handleSaveRequestClick, 's', true);

  const collections = globalState.collections.get();
  const currentRequest = globalState.currentRequest.get();

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
    globalState.currentRequest.data.merge({ method });
    globalState.requestChanged.set(true);
  };

  const setUri = (uri: string) => {
    globalState.currentRequest.data.merge({ uri });
    globalState.requestChanged.set(true);
  };

  const setHeaders = (headers: Array<KVRow>) => {
    globalState.currentRequest.data.merge({ headers });
    globalState.requestChanged.set(true);
  };

  const setBody = (body: string) => {
    globalState.currentRequest.data.merge({ body });
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

  async function _sendSaveRequest(method: string, body: any): Promise<Response> {
    const response = await fetch('/api/request', {
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
      if (
        globalState.currentRequest.id.get() === -1 &&
        globalState.currentRequest.collectionId.get() === -1
      ) {
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

  function handleSendButtonClick() {
    if (!isExtInitialized.current) {
      openExtModal();
      return;
    }
    if (globalState.requestLoading.get()) {
      globalState.requestLoading.set(false);
      return;
    }

    let requestWithoutResponse = {
      ...currentRequest,
      data: { ...currentRequest.data, response: null },
    } as Request;

    const requestCollection = collections.find(
      (c) => c.id === currentRequest.collectionId,
    );

    if (requestCollection) {
      const selectedEnvData = getSelectedEnvData(requestCollection);
      const interpolateResult = interpolate(requestWithoutResponse, selectedEnvData);

      requestWithoutResponse = interpolateResult.result;
    }

    const url = appendHttpIfNoProtocol(requestWithoutResponse.data.uri);

    const headers = kvRowsToMap(requestWithoutResponse.data.headers);

    const options: any = { headers, method: requestWithoutResponse.data.method };
    if (requestWithoutResponse.data.body) {
      options['body'] = requestWithoutResponse.data.body;
    }

    globalState.requestLoading.set(true);

    window.postMessage(
      {
        url,
        type: 'send-request',
        options: options,
      },
      '*',
    );
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <UriBar
          uri={globalState.currentRequest.data.value.uri ?? ''}
          setUri={setUri}
          method={globalState.currentRequest.data.value.method ?? ''}
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
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel>
            <KVEditor name="params" kvs={params} setKvs={setUriFromParams} />
          </TabPanel>
          <TabPanel>
            <KVEditor name="headers" kvs={headers} setKvs={setHeaders} />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor
              content={globalState.currentRequest.data.value.body ?? ''}
              setContent={setBody}
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
