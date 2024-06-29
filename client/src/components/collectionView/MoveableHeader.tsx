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
import { Dispatch, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { VscEllipsis, VscFolder, VscFolderOpened } from 'react-icons/vsc';

import api from '../../api';
import { SidebarCollection } from '../../model/Collection';
import Request from '../../model/Request';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import { cn, errorToast, successToast } from '../../utils';
import { parseCurlCommand } from '../../utils/curl';
import { DragItem, DragTypes } from '../../utils/dnd';
import BasicModal from '../basicModal';
import styles from './MoveableHeader.module.css';

type MoveableHeaderProps = {
  collection: SidebarCollection;
  currentCollectionId?: number;
  currentRequstId?: number;
  selectCollection: any;
  selectRequest: any;
  index: number;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
  moveCollection: (dragIndex: number, hoverIndex: number, newParentId: number) => void;
  isCollectionDescendant: (collectionId: number, ancestorId: number) => boolean;
};

type MoveableHeaderState = {
  name: string;
  newRequestName: string;
  importData: string;
  currentModal: string;
};

function MoveableHeader({
  collection,
  currentCollectionId,
  selectCollection,
  selectRequest,
  index,
  duplicateCollection,
  dispatchCollections,
  moveCollection,
  isCollectionDescendant,
}: MoveableHeaderProps) {
  const [state, setState] = useState<MoveableHeaderState>({
    name: collection.name,
    newRequestName: '',
    currentModal: '',
    importData: '',
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

      const draggedCollectionId = monitor.getItem().id;
      const hoveredCollectionId = id;

      if (isCollectionDescendant(draggedCollectionId, hoveredCollectionId)) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      if (!ref.current || !monitor || !monitor.getItem() || monitor.getItem().id === id) {
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
    drop(item, monitor) {
      if (item.index === index) {
        return;
      }
      if (isTopHovered) {
        return moveCollection(item.id, index, monitor.getItem().id);
      }
      if (isMiddleHovered) {
        return moveCollection(item.id, 0, monitor.getItem().id);
      }
      if (isBottomHovered) {
        return moveCollection(item.id, index + 1, monitor.getItem().id);
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DragTypes.COLLECTION,
    item: () => {
      return { id, index };
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
      return '0 -2px 0 var(--chakra-colors-green-500)';
    }
    return 'none';
  }, [isBottomHovered, isMiddleHovered, isTopHovered]);

  drag(drop(ref));

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
    setState({ ...state, newRequestName: '', importData: '' });
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
      className={cn(styles, 'header', [...headerVariants, colorMode])}
      style={{ boxShadow, opacity }}
    >
      {iconVariants.includes('open') ? (
        <VscFolderOpened
          className={cn(styles, 'icon', [colorMode])}
          onClick={handleArrowClick}
        />
      ) : (
        <VscFolder
          className={cn(styles, 'icon', [colorMode])}
          onClick={handleArrowClick}
        />
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
