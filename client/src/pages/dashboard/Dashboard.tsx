import 'allotment/dist/style.css';

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Allotment } from 'allotment';
import { useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventListener } from 'usehooks-ts';

import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import { UserContext } from '../../context';
import { useGlobalState } from '../../state/GlobalState';
import { BASE_PATH, errorToast, parseLocation } from '../../utils';
import styles from './Dashboard.module.css';

function Dashboard() {
  const globalState = useGlobalState();
  const location = useLocation();
  const { user } = useContext(UserContext);
  const [_isExtInitialized, _setIsExtInitialized] = useState<boolean>(false);
  const isExtInitialized = useRef(_isExtInitialized);
  const extVersion = useRef<string | undefined>(undefined);
  const setIsExtInitialized = (result: boolean) => {
    _setIsExtInitialized(result);
    isExtInitialized.current = result;
  };
  const setExtVersion = (result: string) => {
    extVersion.current = result;
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    if (isExtInitialized.current) return;
    const periodic = setInterval(() => {
      console.log('Checking extension');
      if (isExtInitialized.current) {
        clearInterval(periodic);
      } else {
        window.postMessage({ type: 'ping' }, '*');
      }
    }, 2000);
    const getCollections = async () => {
      try {
        const response = await fetch(BASE_PATH + 'api/collection');
        const collections = await response.json();
        const loc = parseLocation(location);
        collections.forEach((c: any) => {
          if (loc.collectionId === c.id) {
            c.open = true;
            if (c.requests) {
              c.requests.forEach((r: any) => {
                if (loc.requestId === r.id) {
                  globalState.currentRequest.set(r);
                }
              });
            }
          }
        });
        globalState.collections.set(collections);
      } catch (e) {
        errorToast('Could not retrieve collections', toast);
      }
    };
    getCollections();
  }, []);

  const handlePongMessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'pong') {
      console.log('Extension connected');
      setIsExtInitialized(true);
      setExtVersion(event.data.version);
      onClose();
    }
  };

  useEventListener('message', handlePongMessage);

  return (
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.allotment}>
        <Allotment defaultSizes={[50, 200]} snap>
          <div className={styles.sidebar}>
            <Sidebar />
          </div>
          <div className={styles.main}>
            <Allotment vertical defaultSizes={[200, 100]} snap>
              <div className={styles.requestPanel}>
                <RequestPanel
                  isExtInitialized={isExtInitialized}
                  extVersion={extVersion}
                  openExtModal={onOpen}
                />
              </div>
              <div className={styles.responsePanel}>
                <ResponsePanel />
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
            The extension could not be connected or needs to be updated. Please install{' '}
            <b>
              <a
                style={{ textDecoration: 'underline' }}
                target="_blank"
                href="https://chrome.google.com/webstore/detail/yaade-extension/mddoackclclnbkmofficmmepfnadolfa"
                rel="noreferrer"
              >
                the extension
              </a>
            </b>{' '}
            and copy the URL of this window into the host field of the extension. Then
            click retry.
            <br />
            Alternatively change the proxy of your current environment to
            &quot;Server&quot;.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr="2" onClick={onClose}>
              Dismiss
            </Button>
            <Button
              colorScheme="green"
              onClick={() => window.postMessage({ type: 'ping' }, '*')}
            >
              Retry
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default Dashboard;
