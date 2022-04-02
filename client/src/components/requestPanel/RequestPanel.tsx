import { Box, Input, Select, useDisclosure, useToast } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useContext,
  useRef,
  useState,
} from 'react';
import { VscSave } from 'react-icons/vsc';

import { CollectionsContext, CurrentRequestContext } from '../../context';
import { parseRequest } from '../../context/CurrentRequestContext';
import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import { appendHttpIfNoProtocol, errorToast, successToast } from '../../utils';
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
  const { collections, writeRequestToCollections } = useContext(CollectionsContext);
  const {
    currentRequest,
    changeCurrentRequest,
    saveRequest,
    saveNewRequest,
    setCurrentRequest,
  } = useContext(CurrentRequestContext);
  const [newReqForm, setNewReqForm] = useState<NewReqFormState>({
    collectionId: -1,
    name: '',
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef(null);
  const toast = useToast();

  useKeyPress(handleSaveRequestClick, 's', true);

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

  const setUri = (uri: string) => {
    changeCurrentRequest({
      ...currentRequest,
      data: {
        ...currentRequest.data,
        uri,
      },
    });
  };

  const params = getParamsFromUri(currentRequest.data.uri);

  const headers =
    currentRequest.data.headers && currentRequest.data.headers.length !== 0
      ? currentRequest.data.headers
      : [{ key: '', value: '' }];

  const setMethod = (method: string) => {
    changeCurrentRequest({
      ...currentRequest,
      data: {
        ...currentRequest.data,
        method,
      },
    });
  };

  function setUriFromParams(params: Array<KVRow>) {
    try {
      let uri = currentRequest.data.uri;
      if (!currentRequest.data.uri.includes('?')) {
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

  const setHeaders = (headers: Array<KVRow>) => {
    changeCurrentRequest({
      ...currentRequest,
      data: {
        ...currentRequest.data,
        headers,
      },
    });
  };

  const setBody = (body: string) => {
    changeCurrentRequest({
      ...currentRequest,
      data: {
        ...currentRequest.data,
        body,
      },
    });
  };

  async function handleSaveNewRequestClick() {
    try {
      const body = {
        collectionId: newReqForm.collectionId,
        type: 'REST',
        data: { ...currentRequest.data, name: newReqForm.name },
      };

      const newRequest = await saveNewRequest(body);

      writeRequestToCollections(newRequest);
      changeCurrentRequest(parseRequest(newRequest));

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
        const savedCurrentRequest = {
          ...currentRequest,
          changed: false,
        };
        writeRequestToCollections(savedCurrentRequest);
        setCurrentRequest(savedCurrentRequest);
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
    if (currentRequest.isLoading) {
      setCurrentRequest({ ...currentRequest, isLoading: false });
      return;
    }
    const url = appendHttpIfNoProtocol(currentRequest.data.uri);

    const headers: Record<string, string> = {};
    currentRequest.data.headers.forEach(({ key, value }: KVRow) => {
      if (key === '') return;
      headers[key] = value;
    });

    const options: any = { headers, method: currentRequest.data.method };
    if (currentRequest.data.body) {
      options['body'] = currentRequest.data.body;
    }

    setCurrentRequest({ ...currentRequest, isLoading: true });

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
          uri={currentRequest.data.uri}
          setUri={setUri}
          method={currentRequest.data.method}
          setMethod={setMethod}
          handleSendButtonClick={handleSendButtonClick}
          isLoading={currentRequest.isLoading}
        />
        <IconButton
          aria-label="save-request-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          onClick={handleSaveRequestClick}
          disabled={!currentRequest.changed}
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
            <BodyEditor content={currentRequest.data.body} setContent={setBody} />
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
