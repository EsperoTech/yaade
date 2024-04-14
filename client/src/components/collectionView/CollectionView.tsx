import {
  AddIcon,
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  LinkIcon,
} from '@chakra-ui/icons';
import {
  EditableTextarea,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Textarea,
  useClipboard,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import type { Identifier } from 'dnd-core';
import { Dispatch, useCallback, useContext, useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { VscEllipsis } from 'react-icons/vsc';

import api from '../../api';
import { SidebarCollection } from '../../model/Collection';
import Request, { SidebarRequest } from '../../model/Request';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import { errorToast, successToast } from '../../utils';
import { cn } from '../../utils';
import { parseCurlCommand } from '../../utils/curl';
import { DragTypes } from '../../utils/dnd';
import BasicModal from '../basicModal';
import styles from './CollectionView.module.css';
import MoveableRequest, { RequestDragItem } from './MoveableRequest';

type CollectionProps = {
  collection: SidebarCollection;
  currentCollectionId?: number;
  currentRequstId?: number;
  selectCollection: any;
  selectRequest: any;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
};

type CollectionState = {
  name: string;
  newRequestName: string;
  importData: string;
  currentModal: string;
};

function CollectionView({
  collection,
  currentRequstId,
  currentCollectionId,
  selectCollection,
  selectRequest,
  renameRequest,
  deleteRequest,
  duplicateRequest,
  duplicateCollection,
  dispatchCollections,
}: CollectionProps) {
  const [state, setState] = useState<CollectionState>({
    name: collection.name,
    newRequestName: '',
    currentModal: '',
    importData: '',
  });
  const initialRef = useRef(null);
  const ref = useRef<HTMLDivElement>(null);
  const { colorMode } = useColorMode();
  const headerVariants = currentCollectionId === collection.id ? ['selected'] : [];
  const iconVariants = collection.open ? ['open'] : [];
  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();
  const { onCopy } = useClipboard(`${window.location.origin}/#/${collection.id}`);

  function handleOnKeyDown(e: any, action: any) {
    if (e.key === 'Enter') {
      action(e);
    }
  }

  async function handleCreateRequestClick() {
    try {
      let data = {};
      if (state.importData) {
        const request = parseCurlCommand(state.importData);
        data = {
          name: state.newRequestName,
          method: request.method,
          uri: request.url,
          headers: Object.entries(request.header).map(([key, value]) => ({
            key,
            value,
          })),
          body: request.body,
        };
      } else {
        data = {
          name: state.newRequestName,
          method: 'GET',
        };
      }
      const response = await api.createRequest(collection.id, data);
      const newRequest = (await response.json()) as Request;

      dispatchCollections({
        type: CollectionsActionType.ADD_REQUEST,
        request: newRequest,
      });
      selectRequest.current(newRequest.id);

      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      console.error(e);
      errorToast('The request could be not created', toast);
    }
  }

  function handleArrowClick() {
    dispatchCollections({
      type: CollectionsActionType.TOGGLE_OPEN_COLLECTION,
      id: collection.id,
    });
  }

  async function handleDeleteCollectionClick() {
    try {
      const response = await api.deleteCollection(collection.id);
      if (response.status !== 200) throw new Error();

      dispatchCollections({
        type: CollectionsActionType.DELETE_COLLECTION,
        id: collection.id,
      });

      onCloseClear();
      successToast('Collection was deleted.', toast);
    } catch (e) {
      errorToast('Could not delete collection.', toast);
    }
  }

  function onCloseClear() {
    setState({ ...state, newRequestName: '', importData: '' });
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
                <Tabs
                  isLazy
                  colorScheme="green"
                  display="flex"
                  flexDirection="column"
                  maxHeight="100%"
                  h="100%"
                >
                  <TabList>
                    <Tab>Basic</Tab>
                    <Tab>Import</Tab>
                  </TabList>
                  <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
                    <TabPanel>
                      <Input
                        placeholder="Name"
                        w="100%"
                        borderRadius={20}
                        backgroundColor={colorMode === 'light' ? 'white' : undefined}
                        colorScheme="green"
                        value={state.newRequestName}
                        onChange={(e) =>
                          setState({ ...state, newRequestName: e.target.value })
                        }
                        ref={initialRef}
                      />
                    </TabPanel>
                    <TabPanel>
                      <Select size="xs" value="curl" marginBottom={4}>
                        <option value="curl">cURL</option>
                      </Select>
                      <Input
                        placeholder="Name"
                        w="100%"
                        borderRadius={20}
                        colorScheme="green"
                        value={state.newRequestName}
                        marginBottom={4}
                        onChange={(e) =>
                          setState({ ...state, newRequestName: e.target.value })
                        }
                      />
                      <Textarea
                        placeholder="cURL"
                        value={state.importData}
                        onChange={(e) =>
                          setState({ ...state, importData: e.target.value })
                        }
                        height="150px"
                        resize="none"
                      />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </BasicModal>
            );
          case 'duplicate':
            return (
              <BasicModal
                isOpen={isOpen}
                onClose={onCloseClear}
                heading={`Duplicate "${collection.name}"`}
                onClick={() => {
                  duplicateCollection(collection.id, state.name);
                  onCloseClear();
                }}
                buttonText="Duplicate"
                buttonColor="green"
                isButtonDisabled={false}
              >
                <Input
                  placeholder="Name"
                  w="100%"
                  borderRadius={20}
                  colorScheme="green"
                  backgroundColor={colorMode === 'light' ? 'white' : undefined}
                  value={state.name}
                  onChange={(e) => setState({ ...state, name: e.target.value })}
                  ref={initialRef}
                />
              </BasicModal>
            );
          case 'delete':
            return (
              <BasicModal
                isOpen={isOpen}
                onClose={onCloseClear}
                heading={`Delete "${collection.name}"`}
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
        }
      })(state.currentModal);

  const moveRequest = useCallback(
    async (id: number, newRank?: number, newCollectionId?: number) => {
      try {
        // move inside the same collection
        if (!newCollectionId && newRank !== undefined) {
          dispatchCollections({
            type: CollectionsActionType.MOVE_REQUEST,
            id,
            newRank,
          });
          const response = await api.moveRequest(id, newRank);
          if (response.status !== 200) throw new Error();
        } else {
          if (!newCollectionId) throw new Error('newCollectionId is undefined');
          dispatchCollections({
            type: CollectionsActionType.CHANGE_REQUEST_COLLECTION,
            id,
            newCollectionId,
          });
          const res = await api.changeRequestCollection(id, newCollectionId);
          if (res.status !== 200) throw new Error();

          successToast('Request was moved.', toast);
        }
      } catch (e) {
        console.error(e);
        errorToast('Could not move request.', toast);
      }
    },
    [dispatchCollections, toast],
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
    (request: SidebarRequest, index: number) => {
      return (
        <MoveableRequest
          key={request.id}
          request={request}
          index={index}
          moveRequest={moveRequest}
          selected={currentRequstId === request.id}
          selectRequest={selectRequest}
          renameRequest={renameRequest}
          deleteRequest={deleteRequest}
          duplicateRequest={duplicateRequest}
          dispatchCollections={dispatchCollections}
        />
      );
    },
    [
      currentRequstId,
      deleteRequest,
      dispatchCollections,
      moveRequest,
      renameRequest,
      duplicateRequest,
      selectRequest,
    ],
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
          onClick={() => selectCollection.current(collection.id)}
          onKeyDown={(e) => handleOnKeyDown(e, handleArrowClick)}
          role="button"
          tabIndex={0}
        >
          <span className={styles.name}>{collection.name}</span>
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
                      icon={<CopyIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        setState({
                          ...state,
                          currentModal: 'duplicate',
                          name: `${collection.name} (copy)`,
                        });

                        onOpen();
                      }}
                    >
                      Duplicate
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
      {collection.open && (
        <div className={cn(styles, 'requests', [...iconVariants, colorMode])}>
          {collection.requests?.map((request, i) => renderRequest(request, i))}
        </div>
      )}
      {currentModal}
    </div>
  );
}

export default CollectionView;
