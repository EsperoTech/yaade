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
import { useCallback, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { VscEllipsis } from 'react-icons/vsc';
import { useNavigate } from 'react-router-dom';

import Collection from '../../model/Collection';
import Request from '../../model/Request';
import {
  getRequest,
  removeCollection,
  removeRequest,
  saveCollection,
  useGlobalState,
  writeRequestToCollections,
} from '../../state/GlobalState';
import { BASE_PATH, errorToast, successToast } from '../../utils';
import { cn } from '../../utils';
import { DragTypes } from '../../utils/dnd';
import BasicModal from '../basicModal';
import CollectionRequest from '../CollectionRequest/CollectionRequest';
import GroupsInput from '../groupsInput';
import styles from './CollectionView.module.css';
import EnvironmentModal from './EnvironmentModal';
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
  const variants = collection.open ? ['open'] : [];
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  function handleCollectionClick() {
    navigate(`/${collection.id}`);
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
                initialRef={undefined}
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
          case 'env':
            return (
              <EnvironmentModal
                collection={collection}
                saveCollection={saveCollection}
                isOpen={isOpen}
                onOpen={onOpen}
                onClose={onClose}
              />
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
      if (!ref.current) {
        return;
      }
      if (item.type !== DragTypes.REQUEST) {
        return;
      }
      const dragRequestId = item.id;
      const dragCollectionId = item.collectionId;
      const hoverCollectionId = collection.id;

      // Don't do anything if it's the same collection
      if (dragCollectionId === hoverCollectionId) {
        return;
      }

      moveRequest(dragRequestId, undefined, hoverCollectionId);
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
        className={cn(styles, 'header', [colorMode]) + ' ' + hoverClass}
        onClick={handleCollectionClick}
        onKeyDown={(e) => handleOnKeyDown(e, handleCollectionClick)}
        role="button"
        tabIndex={0}
        data-handler-id={handlerId}
      >
        <ChevronRightIcon className={cn(styles, 'icon', [...variants, colorMode])} />
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
                    icon={<DragHandleIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setState({ ...state, currentModal: 'env' });
                      onOpen();
                    }}
                  >
                    Environment
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
      <div className={cn(styles, 'requests', [...variants, colorMode])}>
        {collection.requests?.map((request, i) => renderRequest(request, i))}
      </div>
      {currentModal}
    </div>
  );
}

export default CollectionView;
