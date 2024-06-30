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
import { VscEllipsis, VscFolder, VscFolderOpened } from 'react-icons/vsc';

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
import MoveableHeader from './MoveableHeader';
import MoveableRequest, { RequestDragItem } from './MoveableRequest';

type CollectionProps = {
  collection: SidebarCollection;
  currentCollectionId?: number;
  currentRequstId?: number;
  selectCollection: any;
  selectRequest: any;
  index: number;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
  renderCollection: (collection: SidebarCollection, index: number) => any;
  moveCollection: (dragIndex: number, hoverIndex: number, newParentId?: number) => void;
  isCollectionDescendant: (collectionId: number, ancestorId: number) => boolean;
};

function CollectionView({
  collection,
  currentRequstId,
  currentCollectionId,
  selectCollection,
  selectRequest,
  index,
  renameRequest,
  deleteRequest,
  duplicateRequest,
  duplicateCollection,
  dispatchCollections,
  renderCollection,
  moveCollection,
  isCollectionDescendant,
}: CollectionProps) {
  const { colorMode } = useColorMode();
  const iconVariants = collection.open ? ['open'] : [];

  const toast = useToast();

  const moveRequest = useCallback(
    async (id: number, newRank: number, newCollectionId: number) => {
      try {
        dispatchCollections({
          type: CollectionsActionType.MOVE_REQUEST,
          id,
          newRank,
          newCollectionId,
        });
        const response = await api.moveRequest(id, newRank, newCollectionId);
        if (response.status !== 200) throw new Error();
        successToast('Request was moved.', toast);
      } catch (e) {
        console.error(e);
        errorToast('Could not move request.', toast);
      }
    },
    [dispatchCollections, toast],
  );

  const renderRequest = useCallback(
    (request: SidebarRequest, index: number) => {
      return (
        <MoveableRequest
          key={request.id}
          request={request}
          index={index}
          depth={collection.depth}
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
    <>
      <MoveableHeader
        collection={collection}
        currentCollectionId={currentCollectionId}
        selectCollection={selectCollection}
        selectRequest={selectRequest}
        index={index}
        moveCollection={moveCollection}
        moveRequest={moveRequest}
        duplicateCollection={duplicateCollection}
        dispatchCollections={dispatchCollections}
        isCollectionDescendant={isCollectionDescendant}
      />
      {collection.open && (
        <div className={cn(styles, 'collection', [...iconVariants, colorMode])}>
          {collection.children?.map((child: SidebarCollection, i: number) =>
            renderCollection(child, i),
          )}
        </div>
      )}
      {collection.open && (
        <div className={cn(styles, 'requests', [...iconVariants, colorMode])}>
          {collection.requests?.map((request, i) => renderRequest(request, i))}
        </div>
      )}
    </>
  );
}

export default CollectionView;
