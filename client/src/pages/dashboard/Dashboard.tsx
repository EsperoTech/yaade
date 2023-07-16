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
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useEventListener } from 'usehooks-ts';

import CollectionPanel from '../../components/collectionPanel';
import Header from '../../components/header';
import RequestPanel from '../../components/requestPanel';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import { SidebarCollection } from '../../model/Collection';
import {
  CollectionsActionType,
  collectionsReducer,
  defaultCollections,
} from '../../state/Collections';
import {
  CurrentCollectionActionType,
  currentCollectionReducer,
} from '../../state/currentCollection';
import {
  CurrentRequestActionType,
  currentRequestReducer,
  defaultCurrentRequest,
} from '../../state/currentRequest';
import { BASE_PATH, errorToast, parseLocation } from '../../utils';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [collections, dispatchCollections] = useReducer(
    collectionsReducer,
    defaultCollections,
  );
  const [currentRequest, dispatchCurrentRequest] = useReducer(
    currentRequestReducer,
    defaultCurrentRequest,
  );
  const [currentCollection, dispatchCurrentCollection] = useReducer(
    currentCollectionReducer,
    undefined,
  );
  // TODO: potentially wrap in useRef - this will prevent unnecessary rerenders
  const saveCurrentCollection = useCallback(() => {
    if (!currentCollection || !currentCollection.isChanged || currentCollection.id === -1)
      return;
    dispatchCollections({
      type: CollectionsActionType.WRITE_CURRENT_COLLECTION,
      collection: currentCollection,
    });
    dispatchCurrentCollection({
      type: CurrentCollectionActionType.SET_IS_CHANGED,
      isChanged: false,
    });
    dispatchCurrentRequest({
      type: CurrentRequestActionType.UNSET,
    });
  }, [currentCollection]);
  const shouldSaveRequestOnClose =
    currentRequest && currentRequest.isChanged && currentRequest.id !== -1;
  const location = useLocation();
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
  const sidebarCollections: SidebarCollection[] = collections.map((c) => ({
    id: c.id,
    name: c.data.name,
    open: c.open,
    selected: false,
    groups: c.data.groups,
    requests: c.requests?.map((r) => ({
      id: r.id,
      name: r.data.name,
      method: r.data.method,
    })),
  }));

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
            if (loc.requestId && c.requests) {
              c.requests.forEach((r: any) => {
                if (loc.requestId === r.id) {
                  dispatchCurrentRequest({
                    type: CurrentRequestActionType.SET,
                    request: r,
                  });
                }
              });
            } else {
              dispatchCurrentCollection({
                type: CurrentCollectionActionType.SET,
                collection: c,
              });
            }
          }
        });
        dispatchCollections({
          type: CollectionsActionType.SET,
          collections: collections,
        });
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

  async function handleSaveRequest(request: Request) {
    try {
      const response = await fetch(BASE_PATH + 'api/request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (response.status !== 200) throw new Error();
      writeRequestToCollections(request);
      globalState.requestChanged.set(false);
    } catch (e) {
      errorToast('Could not save request', toast);
    }
  }

  async function handleSaveCollection(collection: Collection) {
    try {
      const response = await fetch(BASE_PATH + 'api/collection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collection),
      });
      if (response.status !== 200) throw new Error();

      writeCollectionData(collection.id, collection.data);
      globalState.collectionChanged.set(false);
      successToast('Collection was saved.', toast);
    } catch (e) {
      errorToast('The collection could not be saved.', toast);
    }
  }

  function saveOnClose() {
    if (currentRequest && globalState.requestChanged.value && currentRequest?.id !== -1) {
      handleSaveRequest(currentRequest);
    } else if (currentCollection && globalState.collectionChanged.value) {
      handleSaveCollection(currentCollection);
    }
    globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
    globalState.currentCollection.set(undefined);
    globalState.requestChanged.set(false);
    globalState.collectionChanged.set(false);
  }

  function handleRequestClick() {
    console.log(globalState.collections.get({ noproxy: true }));
    navigate(`/${request.collectionId}/${request.id}`);
    if (currentRequest?.id === request.id) return;
    if (user?.data?.settings?.saveOnClose) {
      saveOnClose();
    } else if (
      currentRequest &&
      globalState.requestChanged.value &&
      currentRequest?.id !== -1
    ) {
      setState({ ...state, currentModal: 'save-request' });
      onOpen();
    } else if (currentCollection && globalState.collectionChanged.value) {
      setState({ ...state, currentModal: 'save-collection' });
      onOpen();
    } else {
      globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
      globalState.currentCollection.set(undefined);
    }
  }

  useEventListener('message', handlePongMessage);

  let panel = <div>Select a Request or Collection</div>;
  if (currentCollection) {
    panel = (
      <CollectionPanel
        currentCollection={currentCollection}
        dispatchCurrentCollection={dispatchCurrentCollection}
        dispatchCollections={dispatchCollections}
      />
    );
  }
  if (currentRequest) {
    panel = (
      <Allotment vertical defaultSizes={[200, 100]} snap>
        <div className={styles.requestPanel}>
          <RequestPanel
            currentRequest={currentRequest}
            dispatchCurrentRequest={dispatchCurrentRequest}
            isExtInitialized={isExtInitialized}
            extVersion={extVersion}
            openExtModal={onOpen}
          />
        </div>
        <div className={styles.responsePanel}>
          <ResponsePanel />
        </div>
      </Allotment>
    );
  }

  const requestNotSavedModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Request not saved`}
      onClick={() => {
        saveOnClose();
        onCloseClear();
      }}
      buttonText="Save"
      buttonColor="green"
      isButtonDisabled={false}
      secondaryButtonText="Discard"
      onSecondaryButtonClick={() => {
        globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
        globalState.requestChanged.set(false);
        onCloseClear();
      }}
    >
      The request has unsaved changes which will be lost if you choose to change the tab
      now.
      <br />
      Do you want to save the changes now?
    </BasicModal>
  );

  const collectionNotSavedModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Collection not saved`}
      onClick={() => {
        saveOnClose();
        onCloseClear();
      }}
      buttonText="Save"
      buttonColor="green"
      isButtonDisabled={false}
      secondaryButtonText="Discard"
      onSecondaryButtonClick={() => {
        globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
        globalState.currentCollection.set(undefined);
        globalState.collectionChanged.set(false);
        onCloseClear();
      }}
    >
      The collection has unsaved changes which will be lost if you choose to change the
      tab now.
      <br />
      Do you want to save the changes now?
    </BasicModal>
  );

  return (
    <div className={styles.parent}>
      <header>
        <Header />
      </header>
      <div className={styles.allotment}>
        <Allotment defaultSizes={[50, 200]} snap>
          <div className={styles.sidebar}>
            <Sidebar collections={sidebarCollections} />
          </div>
          <div className={styles.main}>{panel}</div>
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
