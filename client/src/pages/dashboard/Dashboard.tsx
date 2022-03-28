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
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import BasicModal from '../../components/basicModal';
import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import { CollectionsContext } from '../../context/collectionsContext/CollectionsContext';
import Collection from '../../model/Collection';
import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import {
  appendHttpIfNoProtocol,
  errorToast,
  parseResponseEvent,
  successToast,
} from '../../utils';
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
  isLoading: false,
  collectionId: -1,
  selected: false,
};

function Dashboard() {
  const { setCollections } = useContext(CollectionsContext);
  const [currentRequest, setCurrentRequest] = useState<Request>(defaultRequest);
  const [_isExtInitialized, _setIsExtInitialized] = useState<boolean>(false);
  const isExtInitialized = useRef(_isExtInitialized);
  const setIsExtInitialized = (result: boolean) => {
    _setIsExtInitialized(result);
    isExtInitialized.current = result;
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleResponseMessage = useCallback(
    (event: MessageEvent<any>) => {
      if (event.data.type === 'receive-response') {
        if (event.data.response.err) {
          setCurrentRequest((request) => ({ ...request, isLoading: false }));
          errorToast(event.data.response.err, toast);
          return;
        }

        const response = parseResponseEvent(event);

        setCurrentRequest((request) => ({
          ...request,
          data: {
            ...request.data,
            response: response,
          },
          isLoading: false,
        }));
      }
    },
    [toast, setCurrentRequest],
  );

  const getCollections = useCallback(async () => {
    try {
      const response = await fetch('/api/collection');
      const collections = await response.json();
      setCollections(collections);
    } catch (e) {
      errorToast('Could not retrieve collections', toast);
    }
  }, [toast, setCollections]);

  const handlePongMessage = useCallback(
    (event: MessageEvent<any>) => {
      if (event.data.type === 'pong') {
        setIsExtInitialized(true);
        window.addEventListener('message', handleResponseMessage);
        onClose();
        getCollections();
      }
    },
    [getCollections, onClose, handleResponseMessage],
  );

  const initExtension = useCallback(() => {
    window.addEventListener('message', handlePongMessage);
    setTimeout(() => {
      if (!isExtInitialized.current) {
        onOpen();
      }
    }, 600);
    window.postMessage({ type: 'ping' }, '*');
  }, [onOpen, handlePongMessage]);

  useEffect(() => {
    if (isExtInitialized.current) return;
    initExtension();
    return () => {
      window.removeEventListener('message', handlePongMessage);
    };
  }, [initExtension, handlePongMessage]);

  function handleSendButtonClick() {
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
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.allotment}>
        <Allotment defaultSizes={[50, 200]} snap>
          <div className={styles.sidebar}>
            <Sidebar setCurrentRequest={setCurrentRequest} />
          </div>
          <div className={styles.main}>
            <Allotment vertical defaultSizes={[200, 100]} snap>
              <div className={styles.requestPanel}>
                <RequestPanel
                  request={currentRequest}
                  setRequest={setCurrentRequest}
                  handleSendButtonClick={handleSendButtonClick}
                />
              </div>
              <div className={styles.responsePanel}>
                <ResponsePanel response={currentRequest.data.response} />
              </div>
            </Allotment>
          </div>
        </Allotment>
      </div>
      <Modal isOpen={isOpen} onClose={() => {}}>
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
