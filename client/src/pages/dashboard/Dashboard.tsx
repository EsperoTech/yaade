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
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useEventListener } from 'usehooks-ts';

import api from '../../api';
import BasicModal from '../../components/basicModal';
import CmdPalette from '../../components/cmdPalette';
import CollectionPanel from '../../components/collectionPanel';
import Header from '../../components/header';
import RequestSender from '../../components/requestPanel/RequestSender';
import ResponsePanel from '../../components/responsePanel';
import Sidebar from '../../components/sidebar';
import { UserContext } from '../../context';
import Collection, { CurrentCollection, SidebarCollection } from '../../model/Collection';
import Request, { SidebarRequest } from '../../model/Request';
import {
  CollectionsActionType,
  collectionsReducer,
  defaultCollections,
  findCollection,
  findRequest,
} from '../../state/collections';
import {
  CurrentCollectionActionType,
  currentCollectionReducer,
} from '../../state/currentCollection';
import {
  CurrentRequestActionType,
  currentRequestReducer,
  defaultCurrentRequest,
} from '../../state/currentRequest';
import { BASE_PATH, errorToast, parseLocation, successToast } from '../../utils';
import styles from './Dashboard.module.css';

function mapRequestToSidebarRequest(r: Request): SidebarRequest {
  return {
    id: r.id,
    collectionId: r.collectionId,
    name: r.data.name ?? '',
    method: r.data.method ?? '',
  };
}

function mapCollectionToSidebarCollection(
  c: Collection,
  index: number,
  depth: number = 0,
): SidebarCollection {
  return {
    id: c.id,
    name: c.data.name ?? '',
    open: c.open,
    selected: false,
    index: index,
    parentId: c.data.parentId,
    groups: c.data.groups,
    requests: c.requests?.map(mapRequestToSidebarRequest) ?? [],
    children:
      c.children?.map((col, i) => mapCollectionToSidebarCollection(col, i, depth + 1)) ??
      [],
    depth,
  };
}

function openCollectionTree(collections: Collection[], id: number) {
  let parentId: number | undefined = id;

  while (parentId) {
    const parent = findCollection(collections, parentId);
    if (!parent) return;
    parent.open = true;
    parentId = parent.data.parentId;
  }
}

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
  const [selectedRequestId, setSelectedRequestId] = useState<number | undefined>(
    undefined,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(
    undefined,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const isExtInitialized = useRef(false);
  const extVersion = useRef<string | undefined>(undefined);
  const setExtVersion = (result: string) => {
    extVersion.current = result;
  };
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isSaveReqOpen,
    onOpen: onSaveReqOpen,
    onClose: onSaveReqClose,
  } = useDisclosure();
  const {
    isOpen: isSaveCollectionOpen,
    onOpen: onSaveCollectionOpen,
    onClose: onSaveCollectionClose,
  } = useDisclosure();
  const { user } = useContext(UserContext);
  const [collectionPanelTabIndex, setCollectionPanelTabIndex] = useState(0);
  const [requestPanelTabIndex, setRequestPanelTabIndex] = useState(0);

  const toast = useToast();
  const sidebarCollections: SidebarCollection[] = useMemo(() => {
    return collections.map((col, i) => mapCollectionToSidebarCollection(col, i));
  }, [collections]);

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
        if (loc.requestId && loc.collectionId) {
          const r = findRequest(collections, loc.requestId);
          if (r) {
            const code = new URLSearchParams(window.location.search).get('code');
            if (code) {
              await getRequestAccessTokenFromCode(code, r);
            }
            dispatchCurrentRequest({
              type: CurrentRequestActionType.SET,
              request: r,
            });
            dispatchCurrentCollection({
              type: CurrentCollectionActionType.UNSET,
            });
          }
          openCollectionTree(collections, loc.collectionId);
        } else if (loc.collectionId) {
          const c = findCollection(collections, loc.collectionId);
          if (c) {
            const code = new URLSearchParams(window.location.search).get('code');
            if (code) {
              await getCollectionAccessTokenFromCode(code, c);
            }
            dispatchCurrentCollection({
              type: CurrentCollectionActionType.SET,
              collection: c,
            });
            dispatchCurrentRequest({
              type: CurrentRequestActionType.UNSET,
            });
          }
          openCollectionTree(collections, loc.collectionId);
        }
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

  async function getRequestAccessTokenFromCode(code: string, request: Request) {
    const oauthConfig = request.data.auth?.oauth2;
    if (!oauthConfig) {
      errorToast('Auth data not found for request.', toast);
      return;
    }

    const { tokenUrl, clientId, clientSecret, grantType } = oauthConfig;

    if (!tokenUrl || !clientId || !grantType) {
      console.log('Required oauth2 parameters are missing.');
      return;
    }

    const url = new URL(window.location.href);
    let redirectUri = `${url.protocol}//${url.host}/#/${request.collectionId}/${request.id}`;

    const data = new URLSearchParams();
    data.append('code', code);
    data.append('client_id', clientId);
    if (clientSecret) {
      data.append('client_secret', clientSecret);
    }
    data.append('redirect_uri', redirectUri);
    data.append('grant_type', grantType);

    try {
      const res = await api.exchangeOAuthToken(tokenUrl, data.toString());
      if (!res.ok) {
        throw new Error('Failed to exchange code for token');
      }
      const body: any = await res.json();

      const newData = {
        ...request.data,
        auth: {
          ...request.data.auth,
          oauth2: {
            ...oauthConfig,
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
            tokenType: body.token_type,
            expiresIn: body.expires_in,
            scope: body.scope,
          },
        },
      };
      const newRequest = {
        ...request,
        data: newData,
      };
      await api.updateRequest(newRequest);
      dispatchCollections({
        type: CollectionsActionType.PATCH_REQUEST_DATA,
        id: request.id,
        data: newData,
      });
      successToast('Token was successfully generated.', toast);
    } catch (e) {
      console.error(e);
      errorToast('Failed to fetch token: ' + e, toast);
    } finally {
      history.pushState({}, '', `/#/${request.collectionId}/${request.id}`);
    }
  }

  async function getCollectionAccessTokenFromCode(code: string, collection: Collection) {
    const oauthConfig = collection.data.auth?.oauth2;
    if (!oauthConfig) {
      errorToast('Auth data not found for collection.', toast);
      return;
    }

    const { tokenUrl, clientId, clientSecret, grantType } = oauthConfig;

    if (!tokenUrl || !clientId || !grantType) {
      console.log('Required oauth2 parameters are missing.');
      return;
    }

    const url = new URL(window.location.href);
    let redirectUri = `${url.protocol}//${url.host}/#/${collection.id}`;

    const data = new URLSearchParams();
    data.append('code', code);
    data.append('client_id', clientId);
    if (clientSecret) {
      data.append('client_secret', clientSecret);
    }
    data.append('redirect_uri', redirectUri);
    data.append('grant_type', grantType);

    try {
      const res = await api.exchangeOAuthToken(tokenUrl, data.toString());
      if (!res.ok) {
        throw new Error('Failed to exchange code for token');
      }
      const body: any = await res.json();

      const newData = {
        ...collection.data,
        auth: {
          ...collection.data.auth,
          oauth2: {
            ...oauthConfig,
            accessToken: body.access_token,
            refreshToken: body.refresh_token,
            tokenType: body.token_type,
            expiresIn: body.expires_in,
            scope: body.scope,
          },
        },
      };
      const newCollection = {
        ...collection,
        data: newData,
      };
      await api.updateCollection(newCollection);
      dispatchCollections({
        type: CollectionsActionType.PATCH_COLLECTION_DATA,
        id: collection.id,
        data: newData,
      });
      successToast('Token was successfully generated.', toast);
    } catch (e) {
      console.error(e);
      errorToast('Failed to fetch token: ' + e, toast);
    } finally {
      history.pushState({}, '', `/#/${collection.id}`);
    }
  }

  const handlePongMessage = (event: MessageEvent<any>) => {
    if (event.data.type === 'pong') {
      console.log('Extension connected');
      // setIsExtInitialized(true);
      isExtInitialized.current = true;
      setExtVersion(event.data.version);
      onClose();
    }
  };

  const dispatchSelectCollection = useCallback(
    (id: number) => {
      const collection = findCollection(collections, id);
      if (!collection) throw new Error("Collection doesn't exist");
      navigate(`/${id}`);
      dispatchCurrentRequest({
        type: CurrentRequestActionType.UNSET,
      });
      dispatchCurrentCollection({
        type: CurrentCollectionActionType.SET,
        collection: collection,
      });
    },
    [collections, navigate],
  );

  const dispatchSelectRequest = useCallback(
    (id: number) => {
      const request = findRequest(collections, id);
      if (!request) throw new Error("Request doesn't exist");
      navigate(`/${request.collectionId}/${request.id}`);
      dispatchCurrentRequest({
        type: CurrentRequestActionType.SET,
        request: request,
      });
      dispatchCurrentCollection({
        type: CurrentCollectionActionType.UNSET,
      });
    },
    [collections, navigate],
  );

  const updateRequest = useCallback(
    (request: Request) =>
      api
        .updateRequest(request)
        .then((res) => {
          if (res.status !== 200) throw new Error();
          successToast('Request was saved.', toast);
        })
        .catch((e) => {
          console.error(e);
          errorToast('Could not save request', toast);
        }),
    [toast],
  );

  const updateCollection = useCallback(
    (collection: Collection | CurrentCollection) =>
      api
        .updateCollection(collection)
        .then((res) => {
          if (res.status !== 200) throw new Error();
          successToast('Request was saved.', toast);
        })
        .catch((e) => {
          console.error(e);
          errorToast('Could not save request', toast);
        }),
    [toast],
  );

  const selectRequest = useCallback(
    async (id: number) => {
      try {
        if (currentRequest?.id === id) return;
        if (user?.data?.settings?.saveOnClose) {
          if (currentRequest?.isChanged) {
            updateRequest(currentRequest);
            dispatchCollections({
              type: CollectionsActionType.PATCH_REQUEST_DATA,
              id: currentRequest.id,
              data: { ...currentRequest.data },
            });
          } else if (currentCollection?.isChanged) {
            updateCollection(currentCollection);
            dispatchCollections({
              type: CollectionsActionType.PATCH_COLLECTION_DATA,
              id: currentCollection.id,
              data: { ...currentCollection.data },
            });
          }
          dispatchSelectRequest(id);
        } else if (currentRequest?.isChanged && currentRequest?.id !== -1) {
          setSelectedRequestId(id);
          onSaveReqOpen();
        } else if (currentCollection?.isChanged) {
          setSelectedRequestId(id);
          onSaveCollectionOpen();
        } else {
          dispatchSelectRequest(id);
        }
      } catch (e) {
        console.error(e);
        errorToast('Could not select request', toast);
      }
    },
    [
      currentRequest,
      user?.data?.settings?.saveOnClose,
      currentCollection,
      dispatchSelectRequest,
      updateRequest,
      updateCollection,
      onSaveReqOpen,
      onSaveCollectionOpen,
      toast,
    ],
  );

  const selectRequestRef = useRef(selectRequest);

  useEffect(() => {
    selectRequestRef.current = selectRequest;
  }, [selectRequest]);

  const selectCollection = useCallback(
    async (id: number) => {
      try {
        if (currentCollection?.id === id) return;
        if (user?.data?.settings?.saveOnClose) {
          if (currentRequest?.isChanged) {
            updateRequest(currentRequest);
            dispatchCollections({
              type: CollectionsActionType.PATCH_REQUEST_DATA,
              id: currentRequest.id,
              data: { ...currentRequest.data },
            });
          } else if (currentCollection?.isChanged) {
            updateCollection(currentCollection);
            dispatchCollections({
              type: CollectionsActionType.PATCH_COLLECTION_DATA,
              id: currentCollection.id,
              data: { ...currentCollection.data },
            });
          }
          dispatchSelectCollection(id);
        } else if (currentRequest?.isChanged && currentRequest?.id !== -1) {
          setSelectedCollectionId(id);
          onSaveReqOpen();
        } else if (currentCollection?.isChanged) {
          setSelectedCollectionId(id);
          onSaveCollectionOpen();
        } else {
          dispatchSelectCollection(id);
        }
      } catch (e) {
        console.error(e);
        errorToast('Could not select collection', toast);
      }
    },
    [
      currentCollection,
      currentRequest,
      dispatchSelectCollection,
      onSaveCollectionOpen,
      onSaveReqOpen,
      toast,
      updateCollection,
      updateRequest,
      user?.data?.settings?.saveOnClose,
    ],
  );

  const selectCollectionRef = useRef(selectCollection);

  useEffect(() => {
    selectCollectionRef.current = selectCollection;
  }, [selectCollection]);

  const renameRequest = useCallback(
    async (id: number, name: string) => {
      try {
        const request = findRequest(collections, id);
        if (!request) return;
        const newRequest = { ...request, data: { ...request.data, name: name } };
        await api.updateRequest(newRequest);
        dispatchCollections({
          type: CollectionsActionType.PATCH_REQUEST_DATA,
          id: id,
          data: { name: name },
        });
        if (currentRequest?.id === id) {
          dispatchCurrentRequest({
            type: CurrentRequestActionType.PATCH_DATA,
            data: { name: name },
          });
        }
        successToast('Request was renamed.', toast);
      } catch (e) {
        console.error(e);
        errorToast('Could not rename request', toast);
      }
    },
    [collections, currentRequest?.id, toast],
  );
  const deleteRequest = useCallback(
    async (id: number) => {
      try {
        await api.deleteRequest(id);
        dispatchCollections({
          type: CollectionsActionType.DELETE_REQUEST,
          id: id,
        });
        if (currentRequest?.id === id) {
          dispatchCurrentRequest({
            type: CurrentRequestActionType.SET,
            request: defaultCurrentRequest!!,
          });
        }
        successToast('Request was deleted.', toast);
      } catch (e) {
        console.error(e);
        errorToast('Could not delete request', toast);
      }
    },
    [currentRequest?.id, toast],
  );

  const duplicateRequest = useCallback(
    async (id: number, newName: string) => {
      try {
        const request = findRequest(collections, id);
        if (!request) return;
        const res = await api.createRequest(request.collectionId, {
          ...request.data,
          name: newName,
        });
        if (res.status !== 200) throw new Error();
        const newRequestData = await res.json();
        dispatchCollections({
          type: CollectionsActionType.ADD_REQUEST,
          request: newRequestData,
        });
        selectRequestRef.current(newRequestData.id);
        successToast('Request was duplicated.', toast);
      } catch (e) {
        console.error(e);
        errorToast('Could not duplicate request', toast);
      }
    },
    [collections, toast],
  );

  const duplicateCollection = useCallback(
    async (id: number, newName: string) => {
      try {
        const res = await api.duplicateCollection(id, newName);
        if (res.status !== 200) throw new Error();
        const newCollectionData = await res.json();
        dispatchCollections({
          type: CollectionsActionType.ADD_COLLECTION,
          collection: newCollectionData,
        });
        selectCollectionRef.current(newCollectionData.id);
        successToast('Collection was duplicated.', toast);
      } catch (e) {
        console.error(e);
        errorToast('Could not duplicate collection', toast);
      }
    },
    [toast],
  );

  useEventListener('message', handlePongMessage);

  let panel = <div>Select a Request or Collection</div>;
  if (currentCollection) {
    panel = (
      <CollectionPanel
        currentCollection={currentCollection}
        dispatchCurrentCollection={dispatchCurrentCollection}
        dispatchCollections={dispatchCollections}
        tabIndex={collectionPanelTabIndex}
        setTabIndex={setCollectionPanelTabIndex}
      />
    );
  }
  if (currentRequest) {
    panel = (
      <Allotment vertical defaultSizes={[200, 100]} snap>
        <div className={styles.requestPanel}>
          <RequestSender
            currentRequest={currentRequest}
            dispatchCurrentRequest={dispatchCurrentRequest}
            collections={collections}
            dispatchCollections={dispatchCollections}
            isExtInitialized={isExtInitialized}
            extVersion={extVersion}
            openExtModal={onOpen}
          />
        </div>
        <div className={styles.responsePanel}>
          <ResponsePanel response={currentRequest?.data?.response} />
        </div>
      </Allotment>
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
            <Sidebar
              collections={sidebarCollections}
              currentCollectionId={currentCollection?.id}
              currentRequestId={currentRequest?.id}
              selectCollection={selectCollectionRef}
              selectRequest={selectRequestRef}
              renameRequest={renameRequest}
              deleteRequest={deleteRequest}
              duplicateRequest={duplicateRequest}
              duplicateCollection={duplicateCollection}
              dispatchCollections={dispatchCollections}
            />
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
      <BasicModal
        isOpen={isSaveReqOpen}
        initialRef={undefined}
        onClose={() => {
          setSelectedRequestId(undefined);
          setSelectedCollectionId(undefined);
          onSaveReqClose();
        }}
        heading={`Request not saved`}
        onClick={() => {
          if (!currentRequest) return;
          updateRequest(currentRequest);
          dispatchCollections({
            type: CollectionsActionType.PATCH_REQUEST_DATA,
            id: currentRequest.id,
            data: { ...currentRequest.data },
          });
          if (selectedRequestId) {
            dispatchSelectRequest(selectedRequestId);
            setSelectedRequestId(undefined);
          } else if (selectedCollectionId) {
            dispatchSelectCollection(selectedCollectionId);
            setSelectedCollectionId(undefined);
          }
          onSaveReqClose();
        }}
        buttonText="Save"
        buttonColor="green"
        isButtonDisabled={false}
        secondaryButtonText="Discard"
        onSecondaryButtonClick={() => {
          if (selectedRequestId) {
            dispatchSelectRequest(selectedRequestId);
            setSelectedRequestId(undefined);
          } else if (selectedCollectionId) {
            dispatchSelectCollection(selectedCollectionId);
            setSelectedCollectionId(undefined);
          }
          onSaveReqClose();
        }}
      >
        The request has unsaved changes which will be lost if you choose to change the tab
        now.
        <br />
        Do you want to save the changes now?
      </BasicModal>
      <BasicModal
        isOpen={isSaveCollectionOpen}
        initialRef={undefined}
        onClose={() => {
          setSelectedRequestId(undefined);
          setSelectedCollectionId(undefined);
          onSaveCollectionClose();
        }}
        heading={`Collection not saved`}
        onClick={() => {
          if (!currentCollection) return;
          updateCollection(currentCollection);
          dispatchCollections({
            type: CollectionsActionType.PATCH_COLLECTION_DATA,
            id: currentCollection.id,
            data: { ...currentCollection.data },
          });
          if (selectedRequestId) {
            dispatchSelectRequest(selectedRequestId);
            setSelectedRequestId(undefined);
          } else if (selectedCollectionId) {
            dispatchSelectCollection(selectedCollectionId);
            setSelectedCollectionId(undefined);
          }
          onSaveCollectionClose();
        }}
        buttonText="Save"
        buttonColor="green"
        isButtonDisabled={false}
        secondaryButtonText="Discard"
        onSecondaryButtonClick={() => {
          if (selectedRequestId) {
            dispatchSelectRequest(selectedRequestId);
            setSelectedRequestId(undefined);
          } else if (selectedCollectionId) {
            dispatchSelectCollection(selectedCollectionId);
            setSelectedCollectionId(undefined);
          }
          onSaveCollectionClose();
        }}
      >
        The collection has unsaved changes which will be lost if you choose to change the
        tab now.
        <br />
        Do you want to save the changes now?
      </BasicModal>
      {/* <CmdPalette
        collections={collections}
        currentRequest={currentRequest}
        currentCollection={currentCollection}
        selectCollection={selectCollectionRef}
        setCollectionPanelTabIndex={setCollectionPanelTabIndex}
      /> */}
    </div>
  );
}

export default Dashboard;
