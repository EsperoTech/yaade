import { AddIcon, CopyIcon, DeleteIcon, LinkIcon } from '@chakra-ui/icons';
import {
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
import { Dispatch, useContext, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { VscEllipsis, VscFolder, VscFolderOpened } from 'react-icons/vsc';

import api from '../../api';
import { UserContext } from '../../context';
import Collection, { SidebarCollection } from '../../model/Collection';
import Request from '../../model/Request';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import { cn, errorToast, successToast } from '../../utils';
import { parseCurlCommand } from '../../utils/curl';
import { DragItem, DragTypes } from '../../utils/dnd';
import BasicModal from '../basicModal';
import GroupsInput from '../groupsInput';
import styles from './MoveableHeader.module.css';
import { RequestDragItem } from './MoveableRequest';

type MoveableHeaderProps = {
  collection: SidebarCollection;
  currentCollectionId?: number;
  currentRequestId?: number;
  selectCollection: any;
  selectRequest: any;
  index: number;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
  moveCollection: (dragIndex: number, hoverIndex: number, newParentId?: number) => void;
  moveRequest: (id: number, newRank: number, newCollectionId: number) => void;
  isCollectionDescendant: (collectionId: number, ancestorId: number) => boolean;
};

type MoveableHeaderState = {
  name: string;
  newRequestName: string;
  importData: string;
  currentModal: string;
  newCollectionName: string;
  groups: string[];
  uploadFile: any;
  basePath: string;
  selectedImport: string;
};

function calculateTopHoveredRank(
  hoverIndex: number,
  dragIndex: number,
  hoverParentId?: number,
  dragParentId?: number,
) {
  if (hoverParentId !== dragParentId) {
    return hoverIndex;
  }

  return hoverIndex < dragIndex ? hoverIndex : hoverIndex - 1;
}

function calculateBottomHoveredRank(
  hoverIndex: number,
  dragIndex: number,
  hoverParentId?: number,
  dragParentId?: number,
) {
  if (hoverParentId !== dragParentId) {
    return hoverIndex + 1;
  }

  return hoverIndex < dragIndex ? hoverIndex + 1 : hoverIndex;
}

function MoveableHeader({
  collection,
  currentCollectionId,
  selectCollection,
  selectRequest,
  index,
  duplicateCollection,
  dispatchCollections,
  moveCollection,
  moveRequest,
  isCollectionDescendant,
}: MoveableHeaderProps) {
  const { user } = useContext(UserContext);
  const [state, setState] = useState<MoveableHeaderState>({
    name: collection.name,
    newRequestName: '',
    currentModal: '',
    importData: '',
    newCollectionName: '',
    groups: user?.data?.groups ?? [],
    uploadFile: undefined,
    basePath: '',
    selectedImport: 'openapi',
  });
  const id = collection.id;
  const ref = useRef<HTMLDivElement>(null);
  const initialRef = useRef(null);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [isMiddleHovered, setIsMiddleHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);
  const { colorMode } = useColorMode();
  const { onCopy } = useClipboard(`${window.location.origin}/#/${collection.id}`);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const headerVariants = useMemo(() => {
    return currentCollectionId === collection.id ? ['selected'] : [];
  }, [currentCollectionId, collection.id]);
  const iconVariants = useMemo(() => {
    return collection.open ? ['open'] : [];
  }, [collection.open]);
  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    {
      handlerId: Identifier | null;
    }
  >({
    accept: DragTypes.COLLECTION,
    hover(item, monitor) {
      if (!ref.current || !monitor.isOver()) {
        return;
      }

      if (isCollectionDescendant(item.id, id)) {
        return;
      }
      if (!ref.current || !monitor || !item || item.id === id) {
        return {
          handlerId: null,
          hoveredDownwards: false,
          hoveredUpwards: false,
        };
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverTopThirdBoundary =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 3;
      const hoverBottomThirdBoundary =
        ((hoverBoundingRect.bottom - hoverBoundingRect.top) / 3) * 2;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      const hoveredTop = hoverClientY < hoverTopThirdBoundary;
      const hoveredMiddle =
        hoverClientY >= hoverTopThirdBoundary && hoverClientY <= hoverBottomThirdBoundary;
      const hoveredBottom = hoverClientY > hoverBottomThirdBoundary;

      if (hoveredTop) {
        const newRank = calculateTopHoveredRank(
          index,
          item.index,
          collection.parentId,
          item.parentId,
        );
        if (newRank === item.index && item.parentId === collection.parentId) {
          return;
        }
      }

      if (hoveredMiddle) {
        if (collection.id === item.parentId) {
          return;
        }
      }

      if (hoveredBottom) {
        // NOTE: this is a small UX improvement, because in this position it
        // looks like will be moved into the hovered collection when in reality
        // it is moved below it.
        if (collection.open) {
          return;
        }
        const newRank = calculateBottomHoveredRank(
          index,
          item.index,
          collection.parentId,
          item.parentId,
        );
        if (newRank === item.index && item.parentId === collection.parentId) {
          return;
        }
      }

      setIsTopHovered(hoveredTop);
      setIsMiddleHovered(hoveredMiddle);
      setIsBottomHovered(hoveredBottom);
    },
    collect(monitor) {
      if (!ref.current || !monitor || !monitor.getItem() || monitor.getItem().id === id) {
        setIsTopHovered(false);
        setIsMiddleHovered(false);
        setIsBottomHovered(false);
        return {
          handlerId: null,
        };
      }
      if (!monitor.isOver()) {
        setIsTopHovered(false);
        setIsMiddleHovered(false);
        setIsBottomHovered(false);
      }
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    drop(item) {
      if (isTopHovered) {
        const newRank = calculateTopHoveredRank(
          index,
          item.index,
          collection.parentId,
          item.parentId,
        );
        if (newRank === item.index && item.parentId === collection.parentId) {
          return;
        }
        return moveCollection(item.id, newRank, collection.parentId);
      } else if (isMiddleHovered) {
        return moveCollection(item.id, 0, collection.id);
      } else if (isBottomHovered) {
        const newRank = calculateBottomHoveredRank(
          index,
          item.index,
          collection.parentId,
          item.parentId,
        );
        if (newRank === item.index && item.parentId === collection.parentId) {
          return;
        }
        return moveCollection(item.id, newRank, collection.parentId);
      }
    },
  });

  const [{ handlerId: requestHandlerId, hovered }, dropRequest] = useDrop<
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

      moveRequest(item.id, 0, collection.id);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DragTypes.COLLECTION,
    item: () => {
      return {
        id,
        index,
        parentId: collection.parentId,
        isOpen: collection.open,
      };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.5 : 1;
  const boxShadow = useMemo(() => {
    if (isBottomHovered) {
      return '0 2px 0 var(--chakra-colors-green-500)';
    }
    if (isMiddleHovered) {
      return '0 0 0 2px var(--chakra-colors-green-500)';
    }
    if (isTopHovered) {
      return 'inset 0 2px 0 var(--chakra-colors-green-500)';
    }
    return 'none';
  }, [isBottomHovered, isMiddleHovered, isTopHovered]);

  drag(drop(ref));
  dropRequest(ref);
  const hoverClass = hovered ? styles.hovered : '';

  function handleArrowClick() {
    dispatchCollections({
      type: CollectionsActionType.TOGGLE_OPEN_COLLECTION,
      id: collection.id,
    });
  }

  function handleOnKeyDown(e: any, action: any) {
    if (e.key === 'Enter') {
      action(e);
    }
  }

  function onCloseClear() {
    setState({ ...state, newRequestName: '', newCollectionName: '', importData: '' });
    onClose();
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

  async function handleCreateCollectionClick() {
    try {
      let response;
      if (state.uploadFile) {
        const data = new FormData();
        data.append('File', state.uploadFile, 'file');

        if (state.selectedImport === 'openapi') {
          response = await api.importOpenApi(
            state.basePath,
            state.groups,
            data,
            collection.id,
          );
        } else {
          response = await api.importPostman(state.groups, data, collection.id);
        }
      } else {
        response = await api.createCollection(
          state.newCollectionName,
          state.groups,
          collection.id,
        );
      }

      if (response.status !== 200) throw new Error();
      const newCollection = (await response.json()) as Collection;

      dispatchCollections({
        type: CollectionsActionType.ADD_COLLECTION,
        collection: newCollection,
      });

      successToast('A new collection was created and saved', toast);
      onCloseClear();
    } catch (e) {
      console.log(e);
      errorToast('The collection could be not created', toast);
    }
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
          case 'newCollection':
            return (
              <BasicModal
                isOpen={isOpen}
                onClose={onCloseClear}
                initialRef={initialRef}
                heading="Create a new collection"
                onClick={handleCreateCollectionClick}
                isButtonDisabled={state.name === ''}
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
                        my="4"
                        borderRadius={20}
                        colorScheme="green"
                        backgroundColor={colorMode === 'light' ? 'white' : undefined}
                        value={state.newCollectionName}
                        onChange={(e) =>
                          setState({ ...state, newCollectionName: e.target.value })
                        }
                        ref={initialRef}
                      />
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
                    </TabPanel>
                    <TabPanel>
                      <Select
                        size="xs"
                        onChange={(e) =>
                          setState({ ...state, selectedImport: e.target.value })
                        }
                        value={state.selectedImport}
                      >
                        <option value="openapi">OpenAPI</option>
                        <option value="postman">Postman</option>
                      </Select>
                      <input
                        className={cn(styles, 'fileInput', [colorMode])}
                        type="file"
                        accept=".yaml,.json"
                        onChange={(e) => {
                          const openApiFile = e.target.files
                            ? e.target.files[0]
                            : undefined;
                          setState({
                            ...state,
                            uploadFile: openApiFile,
                            name: openApiFile?.name ?? 'filename',
                          });
                        }}
                      />
                      {state.selectedImport === 'openapi' ? (
                        <Input
                          placeholder="Base Path"
                          mb="4"
                          w="100%"
                          borderRadius={20}
                          colorScheme="green"
                          backgroundColor={colorMode === 'light' ? 'white' : undefined}
                          value={state.basePath}
                          onChange={(e) =>
                            setState({ ...state, basePath: e.target.value })
                          }
                        />
                      ) : null}
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

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(styles, 'header', [...headerVariants, colorMode]) + ' ' + hoverClass}
      style={{ boxShadow, opacity }}
    >
      {Array(collection.depth).fill(<div className={styles.line} />)}
      {iconVariants.includes('open') ? (
        <div
          className={cn(styles, 'icon-wrapper', [colorMode])}
          onClick={handleArrowClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleArrowClick();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <VscFolderOpened className={cn(styles, 'icon', [colorMode])} />
        </div>
      ) : (
        <div
          className={cn(styles, 'icon-wrapper', [colorMode])}
          onClick={handleArrowClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleArrowClick();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <VscFolder className={cn(styles, 'icon', [colorMode])} />
        </div>
      )}
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
                    icon={<VscFolder />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setState({ ...state, currentModal: 'newCollection' });
                      onOpen();
                    }}
                  >
                    New Collection
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
      {currentModal}
    </div>
  );
}

export default MoveableHeader;
