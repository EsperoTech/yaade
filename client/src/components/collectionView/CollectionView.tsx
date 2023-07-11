import {
  AddIcon,
  ChevronRightIcon,
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
  LinkIcon,
} from '@chakra-ui/icons';
import {
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useClipboard,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import type { Identifier } from 'dnd-core';
import { useCallback, useContext, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { VscEllipsis } from 'react-icons/vsc';
import { useNavigate } from 'react-router-dom';

import { UserContext } from '../../context';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import {
  getRequest,
  removeCollection,
  removeRequest,
  saveCollection,
  useGlobalState,
  writeCollectionData,
  writeRequestToCollections,
} from '../../state/GlobalState';
import { BASE_PATH, errorToast, successToast } from '../../utils';
import { cn } from '../../utils';
import { DragTypes } from '../../utils/dnd';
import BasicModal from '../basicModal';
import GroupsInput from '../groupsInput';
import styles from './CollectionView.module.css';
import MoveableRequest, { RequestDragItem } from './MoveableRequest';

type CollectionProps = {
  collection: Collection;
};

type CollectionState = {
  name: string;
  groups: Array<string>;
  newGroup: string;
  newRequestName: string;
  currentModal: string;
};

function CollectionView({ collection }: CollectionProps) {
  const [state, setState] = useState<CollectionState>({
    name: collection.data.name,
    groups: collection.data?.groups ?? [],
    newGroup: '',
    newRequestName: '',
    currentModal: '',
  });
  const globalState = useGlobalState();
  const initialRef = useRef(null);
  const ref = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  const headerVariants =
    globalState.currentCollection.value?.id === collection.id ? ['selected'] : [];
  const iconVariants = collection.open ? ['open'] : [];
  const { isOpen, onOpen, onClose } = useDisclosure();
  const currentRequest = globalState.currentRequest.get({ noproxy: true });
  const currentCollection = globalState.currentCollection.get({ noproxy: true });
  const { user } = useContext(UserContext);
  const toast = useToast();
  const { onCopy } = useClipboard(`${window.location.origin}/#/${collection.id}`);
  const navigate = useNavigate();

  function handleOnKeyDown(e: any, action: any) {
    if (e.key === 'Enter') {
      action(e);
    }
  }

  async function handleCreateRequestClick() {
    try {
      const response = await fetch(BASE_PATH + 'api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: state.newRequestName,
          collectionId: collection.id,
          type: 'REST',
        }),
      });

      const newRequest = (await response.json()) as Request;

      writeRequestToCollections(newRequest);
      globalState.currentRequest.set(newRequest);
      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      console.log(e);
      errorToast('The request could be not created', toast);
    }
  }

  async function handleEditCollectionClick() {
    try {
      const response = await fetch(BASE_PATH + 'api/collection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...collection,
          data: {
            ...collection.data,
            name: state.name,
            groups: state.groups,
          },
        }),
      });
      if (response.status !== 200) throw new Error();

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          name: state.name,
          groups: state.groups,
        },
      });
      onClose();
      successToast('Collection was changed.', toast);
    } catch (e) {
      console.log(e, state);
      errorToast('The collection could not be changed.', toast);
    }
  }

  function saveOnClose() {
    if (currentRequest && globalState.requestChanged.value && currentRequest?.id !== -1) {
      handleSaveRequest(currentRequest);
    } else if (currentCollection && globalState.collectionChanged.value) {
      handleSaveCollection(currentCollection);
    }
    globalState.currentRequest.set(undefined);
    globalState.currentCollection.set(JSON.parse(JSON.stringify(collection)));
    globalState.requestChanged.set(false);
    globalState.collectionChanged.set(false);
  }

  function handleCollectionClick() {
    saveCollection({
      ...collection,
      open: true,
    });
    if (currentCollection?.id === collection.id) {
      return;
    }
    navigate(`/${collection.id}`);
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
      globalState.currentRequest.set(undefined);
      globalState.currentCollection.set(JSON.parse(JSON.stringify(collection)));
    }
  }

  function handleArrowClick() {
    saveCollection({
      ...collection,
      open: !collection.open,
    });
  }

  async function handleDeleteCollectionClick() {
    try {
      const response = await fetch(BASE_PATH + `api/collection/${collection.id}`, {
        method: 'DELETE',
      });
      if (response.status !== 200) throw new Error();
      removeCollection(collection.id);
      onCloseClear();
      successToast('Collection was deleted.', toast);
    } catch (e) {
      errorToast('Could not delete collection.', toast);
    }
  }

  function onCloseClear() {
    setState({
      ...state,
      newRequestName: '',
      name: collection.data.name,
      groups: collection.data?.groups ?? [],
    });
    onClose();
  }

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
      // successToast('Collection was saved.', toast);
    } catch (e) {
      errorToast('The collection could not be saved.', toast);
    }
  }

  // NOTE: Setting to null is a workaround for the modal not updating
  // correctly on response scripts
  const currentModal = !isOpen
    ? null
    : ((s: string) => {
        switch (s) {
          case 'newRequest':
            return (
              <BasicModal
                isOpen={isOpen}
                onClose={onCloseClear}
                initialRef={initialRef}
                heading="Create a new request"
                onClick={handleCreateRequestClick}
                isButtonDisabled={state.newRequestName === ''}
                buttonText="Create"
                buttonColor="green"
              >
                <Input
                  placeholder="Name"
                  w="100%"
                  borderRadius={20}
                  colorScheme="green"
                  value={state.newRequestName}
                  onChange={(e) => setState({ ...state, newRequestName: e.target.value })}
                  ref={initialRef}
                />
              </BasicModal>
            );
          case 'edit':
            return (
              <BasicModal
                isOpen={isOpen}
                onClose={onCloseClear}
                initialRef={initialRef}
                heading={`Edit ${collection.data.name}`}
                onClick={handleEditCollectionClick}
                isButtonDisabled={state.name === ''}
                buttonText="Edit"
                buttonColor="green"
              >
                <Heading as="h6" size="xs" mb="4">
                  Name
                </Heading>
                <Input
                  placeholder="Name"
                  w="100%"
                  borderRadius={20}
                  colorScheme="green"
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                  ref={initialRef}
                />
                <Heading as="h6" size="xs" my="4">
                  Groups
                </Heading>
                <GroupsInput
                  groups={state.groups}
                  setGroups={(groups: string[]) =>
                    setState({
                      ...state,
                      groups,
                    })
                  }
                  isRounded
                />
              </BasicModal>
            );
          case 'delete':
            return (
              <BasicModal
                isOpen={isOpen}
                onClose={onCloseClear}
                heading={`Delete "${collection.data.name}"`}
                onClick={handleDeleteCollectionClick}
                buttonText="Delete"
                buttonColor="red"
                isButtonDisabled={false}
              >
                Are you sure you want to delete this collection?
                <br />
                The collection cannot be recovered!
              </BasicModal>
            );
          case 'save-request':
            return (
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
                  globalState.currentCollection.set(
                    JSON.parse(JSON.stringify(collection)),
                  );
                  globalState.currentRequest.set(undefined);
                  globalState.requestChanged.set(false);
                  onCloseClear();
                }}
              >
                The request has unsaved changes which will be lost if you choose to change
                the tab now.
                <br />
                Do you want to save the changes now?
              </BasicModal>
            );
          case 'save-collection':
            return (
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
                  globalState.currentCollection.set(
                    JSON.parse(JSON.stringify(collection)),
                  );
                  globalState.collectionChanged.set(false);
                  onCloseClear();
                }}
              >
                The collection has unsaved changes which will be lost if you choose to
                change the tab now.
                <br />
                Do you want to save the changes now?
              </BasicModal>
            );
        }
      })(state.currentModal);

  const fetchMoveRequest = useCallback(
    async (id: number, newRank?: number, newCollectionId?: number) => {
      try {
        const res = await fetch(BASE_PATH + `api/request/${id}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            newRank,
            newCollectionId,
          }),
        });
        if (res.status !== 200) throw new Error();
        successToast('Request was moved.', toast);
      } catch (e) {
        errorToast('Could not move request.', toast);
      }
    },
    [toast],
  );

  const moveRequest = useCallback(
    async (id: number, newRank?: number, newCollectionId?: number) => {
      // move inside the same collection
      if (!newCollectionId && newRank !== undefined) {
        const newRequests = collection.requests.slice();
        const currentRank = newRequests.findIndex((r) => r.id === id);
        if (currentRank === -1) return;
        const [item] = newRequests.splice(currentRank, 1);
        newRequests.splice(newRank, 0, item);
        const newCollection = {
          ...collection,
          requests: newRequests,
        };
        saveCollection(newCollection);
        fetchMoveRequest(id, newRank);
        return;
      }
      // move to another collection
      const request = getRequest(id);
      if (!request || !newCollectionId) return;
      const newRequest = { ...request, collectionId: newCollectionId };
      removeRequest(request);
      writeRequestToCollections(newRequest);
      fetchMoveRequest(id, 0, newCollectionId);
    },
    [collection, fetchMoveRequest],
  );

  const [{ handlerId, hovered }, drop] = useDrop<
    RequestDragItem,
    void,
    { handlerId: Identifier | null; hovered: boolean }
  >({
    accept: [DragTypes.REQUEST],
    collect(monitor) {
      let hovered = false;
      const item = monitor.getItem();
      if (item && item.type === DragTypes.REQUEST) {
        hovered = monitor.isOver() && item.collectionId !== collection.id;
      }
      return {
        handlerId: monitor.getHandlerId(),
        hovered,
      };
    },
    drop(item: RequestDragItem) {
      if (!ref.current || item.type !== DragTypes.REQUEST) {
        return;
      }

      // Don't do anything if it's the same collection
      if (item.collectionId === collection.id) {
        return;
      }

      moveRequest(item.id, undefined, collection.id);
    },
  });

  const hoverClass = hovered ? styles.hovered : '';
  drop(ref);

  const renderRequest = useCallback(
    (request: Request, index: number) => {
      return (
        <MoveableRequest
          key={request.id}
          request={request}
          index={index}
          moveRequest={moveRequest}
        />
      );
    },
    [moveRequest],
  );

  return (
    <div className={styles.root}>
      <div
        ref={ref}
        data-handler-id={handlerId}
        className={
          cn(styles, 'header', [...headerVariants, colorMode]) + ' ' + hoverClass
        }
      >
        <ChevronRightIcon
          className={cn(styles, 'icon', [...iconVariants, colorMode])}
          onClick={handleArrowClick}
        />
        <div
          className={styles.wrapper}
          onClick={handleCollectionClick}
          onKeyDown={(e) => handleOnKeyDown(e, handleArrowClick)}
          role="button"
          tabIndex={0}
        >
          <span className={styles.name}>{collection.data.name}</span>
          <span className={styles.actionIcon}>
            <Menu>
              {({ isOpen }) => (
                <>
                  <MenuButton
                    as={IconButton}
                    aria-label="Options"
                    icon={<VscEllipsis />}
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <MenuList
                    zIndex={50}
                    style={{
                      // this is a workaround to fix drag and drop preview not working
                      // see: https://github.com/chakra-ui/chakra-ui/issues/6762
                      display: isOpen ? '' : 'none',
                    }}
                  >
                    <MenuItem
                      icon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setState({ ...state, currentModal: 'newRequest' });
                        onOpen();
                      }}
                    >
                      New Request
                    </MenuItem>
                    <MenuItem
                      icon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setState({ ...state, currentModal: 'edit' });
                        onOpen();
                      }}
                    >
                      Edit
                    </MenuItem>
                    <MenuItem
                      icon={<LinkIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy();
                        successToast('Link copied to clipboard.', toast);
                      }}
                    >
                      Copy Link
                    </MenuItem>
                    <MenuItem
                      icon={<DeleteIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setState({ ...state, currentModal: 'delete' });
                        onOpen();
                      }}
                    >
                      Delete
                    </MenuItem>
                  </MenuList>
                </>
              )}
            </Menu>
          </span>
        </div>
      </div>
      <div className={cn(styles, 'requests', [...iconVariants, colorMode])}>
        {collection.requests?.map((request, i) => renderRequest(request, i))}
      </div>
      {currentModal}
    </div>
  );
}

export default CollectionView;
