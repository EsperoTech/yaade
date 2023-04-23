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
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventListener } from 'usehooks-ts';

import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import { UserContext } from '../../context';
import Request from '../../model/Request';
import Response from '../../model/Response';
import { getEnvVar, setEnvVar, useGlobalState } from '../../state/GlobalState';
import {
  BASE_PATH,
  errorToast,
  getRequestIdFromMessageId,
  parseLocation,
} from '../../utils';
import { executeResponseScript } from '../../utils/script';
import { getSelectedEnvs } from '../../utils/store';
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

  // const handleResponseMessage = async (event: MessageEvent<any>) => {
  //   if (
  //     event.data.type === 'receive-response' &&
  //     event.data.response &&
  //     !event.data.response.metaData?.isRequestScript
  //   ) {
  //     globalState.requestLoading.set(false);
  //     if (event.data.response.err) {
  //       errorToast(event.data.response.err, toast);
  //       return;
  //     }

  //     const req = getRequestFromMessageId(event.data.metaData?.messageId);
  //     if (!req) {
  //       errorToast(
  //         'Could not get requestId from messageId: ' + event.data.metaData?.messageId,
  //         toast,
  //       );
  //       return;
  //     }

  //     const response = parseExtensionResponse(event);

  //     if (req.data.responseScript) {
  //       doResponseScript(req, response, event.data.metaData?.envName);
  //     }

  //     const newRequest = {
  //       ...req,
  //       data: {
  //         ...req.data,
  //         response: response,
  //       },
  //     };

  //     if (req.id !== -1 && user?.data?.settings?.saveOnSend) {
  //       const response = await fetch(BASE_PATH + 'api/request', {
  //         method: 'PUT',
  //         headers: {
  //           'Content-Type': 'application/json',
  //         },
  //         body: JSON.stringify(newRequest),
  //       });
  //       if (response.status !== 200) throw new Error();
  //       writeRequestToCollections(newRequest);
  //     }
  //     if (req.id === globalState.currentRequest.value.id) {
  //       globalState.currentRequest.set(newRequest);
  //     }
  //   }
  // };

  const getRequestFromMessageId = (messageId?: string): Request | undefined => {
    if (messageId) {
      const requestId = getRequestIdFromMessageId(messageId);
      return globalState.collections
        .get()
        .flatMap((c) => c.requests)
        .find((r) => r.id === requestId);
    } else {
      // TODO: remove once v1.3 of extension is not used anymore and all requests have a messageId
      return globalState.currentRequest.get({ noproxy: true });
    }
  };

  const doResponseScript = async (
    request: Request,
    response: Response,
    envName?: string,
  ) => {
    const responseScript = request.data.responseScript;
    if (responseScript) {
      if (!envName) {
        const envs = getSelectedEnvs();
        envName = envs[request.collectionId];
      }

      if (envName) {
        // NOTE: cannot pass state on top level because it does not use most current state
        const set = (key: string, value: string) =>
          setEnvVar(request.collectionId, envName)(globalState, key, value);
        const get = (key: string): string =>
          getEnvVar(request.collectionId, envName)(globalState, key);
        executeResponseScript(
          response,
          responseScript,
          set,
          get,
          toast,
          request.id,
          envName,
        );
      }
    }
  };

  useEventListener('message', handlePongMessage);
  // useEventListener('message', handleResponseMessage);

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
