import 'allotment/dist/style.css';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Allotment } from 'allotment';
import { useEffect, useRef, useState } from 'react';

import BasicModal from '../../components/basicModal';
import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import Collection from '../../model/Collection';
import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import Response from '../../model/Response';
import { errorToast, parseResponseEvent, successToast } from '../../utils';
import { useKeyPress } from '../../utils/useKeyPress';
import styles from './Dashboard.module.css';

const defaultRequest: Request = {
  id: -1,
  type: 'REST',
  data: {
    name: '',
    uri: '',
    method: 'GET',
    params: [
      {
        key: '',
        value: '',
      },
    ],
    headers: [
      {
        key: '',
        value: '',
      },
    ],
    body: '',
  },
  selected: true,
  isLoading: false,
  collectionId: -1,
};

type NewReqFormState = {
  collectionId: number;
  name: string;
};

function Dashboard() {
  const [collections, setCollections] = useState<Array<Collection>>([]);
  const [request, setRequest] = useState<Request>(defaultRequest);
  const [newReqForm, setNewReqForm] = useState<NewReqFormState>({
    collectionId: collections.length >= 1 ? collections[0].id : -1,
    name: '',
  });
  const [_isExtInitialized, _setIsExtInitialized] = useState<boolean>(false);
  const isExtInitialized = useRef(_isExtInitialized);
  const setIsExtInitialized = (result: boolean) => {
    _setIsExtInitialized(result);
    isExtInitialized.current = result;
  };
  const initialRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isExtFail,
    onOpen: onOpenExtFail,
    onClose: onCloseExtFail,
  } = useDisclosure();
  const toast = useToast();

  useKeyPress(handleSaveRequestClick, 's', true);

  useEffect(() => {
    initExtension();
    return () => {
      window.removeEventListener('message', handlePongMessage);
    };
  }, []);

  function initExtension() {
    window.addEventListener('message', handlePongMessage);
    setTimeout(() => {
      if (!isExtInitialized.current) {
        onOpenExtFail();
      } else {
        window.addEventListener('message', handleResponseMessage);
        onCloseExtFail();
        getCollections();
      }
    }, 400);
    window.postMessage({ type: 'ping' }, '*');
  }

  const handlePongMessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'pong') {
      setIsExtInitialized(true);
    }
  };

  function handleResponseMessage(event: MessageEvent<any>) {
    if (event.data.type === 'receive-response') {
      if (event.data.response.err) {
        setRequest((request) => ({ ...request, isLoading: false }));
        errorToast(event.data.response.err, toast);
        return;
      }

      const response = parseResponseEvent(event);

      setRequest((request) => ({
        ...request,
        data: {
          ...request.data,
          response: response,
        },
        isLoading: false,
      }));
    }
  }

  async function getCollections() {
    try {
      const response = await fetch('/api/collection');
      const collections = await response.json();
      setCollections(collections);
      setNewReqForm({
        collectionId: collections.length >= 1 ? collections[0].id : -1,
        name: '',
      });
    } catch (e) {
      errorToast('Could not retrieve collections', toast);
    }
  }

  function onCloseClear() {
    setNewReqForm({
      collectionId: collections.length >= 1 ? collections[0].id : -1,
      name: '',
    });
    onClose();
  }

  function handleRequestClick(selectedRequest: Request) {
    const newCollections = [...collections].map((collection) => {
      const requests = collection.requests.map((req) => ({
        ...req,
        selected: selectedRequest.id === req.id,
      }));
      return {
        ...collection,
        requests,
      };
    });
    setCollections(newCollections);
    // TODO: ask user to save request before loading new content
    setRequest(selectedRequest);
  }

  function handleSendButtonClick() {
    if (request.isLoading) {
      setRequest({ ...request, isLoading: false });
      return;
    }

    const headers: Record<string, string> = {};
    request.data.headers.forEach(({ key, value }: KVRow) => {
      if (key === '') return;
      headers[key] = value;
    });

    const options: any = { headers, method: request.data.method };
    if (request.data.body) {
      options['body'] = request.data.body;
    }

    console.log('seinding');

    setRequest({ ...request, isLoading: true });

    window.postMessage(
      {
        url: request.data.uri,
        type: 'send-request',
        options: options,
      },
      '*',
    );
  }

  async function handleSaveNewRequestClick() {
    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: newReqForm.collectionId,
          type: 'REST',
          data: { ...request.data, name: newReqForm.name },
        }),
      });

      const newRequest = (await response.json()) as Request;

      const newCollections = collections.map((c) => {
        const requests = [...c.requests];
        if (c.id === newRequest.collectionId) {
          requests.push({
            ...newRequest,
            selected: true,
          });
        }
        return {
          ...c,
          open: c.id === newRequest.collectionId,
          requests: requests,
        };
      });
      setCollections(newCollections);
      setRequest(newRequest);

      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      errorToast('The request could be not created', toast);
    }
  }

  async function handleSaveRequestClick() {
    try {
      if (request.id === -1 && request.collectionId === -1) {
        onOpen();
      } else {
        const response = await fetch('/api/request', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });
        if (response.status !== 200) throw new Error();

        const newCollections = [...collections].map((collection) => {
          const requests = collection.requests.map((req) => {
            return req.id === request.id ? { ...request, selected: true } : req;
          });
          return {
            ...collection,
            requests,
          };
        });
        setCollections(newCollections);
        successToast('The request was successfully saved.', toast);
      }
    } catch (e) {
      console.log(e);
      errorToast('The request could not be saved.', toast);
    }
  }

  return (
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.allotment}>
        <Allotment defaultSizes={[50, 200]} snap>
          <div className={styles.sidebar}>
            <Sidebar
              collections={collections}
              setCollections={setCollections}
              handleRequestClick={handleRequestClick}
            />
          </div>
          <div className={styles.main}>
            <Allotment vertical defaultSizes={[200, 100]} snap>
              <div className={styles.requestPanel}>
                <RequestPanel
                  request={request}
                  setRequest={setRequest}
                  handleSendButtonClick={handleSendButtonClick}
                  handleSaveRequestClick={handleSaveRequestClick}
                />
              </div>
              <div className={styles.responsePanel}>
                <ResponsePanel response={request.data.response} />
              </div>
            </Allotment>
          </div>
        </Allotment>
      </div>
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
      <Modal isOpen={isExtFail} onClose={() => {}}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Failed to connect to extension</ModalHeader>
          <ModalBody>
            The extension could not be connected. Please install the extension and copy
            the URL of this window into the host field of the extension. Then click retry.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" onClick={initExtension}>
              Retry
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Dashboard;
