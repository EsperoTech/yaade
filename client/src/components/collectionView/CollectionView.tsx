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
import { SidebarScript } from '../../model/Script';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import { errorToast, successToast } from '../../utils';
import { cn } from '../../utils';
import { parseCurlCommand } from '../../utils/curl';
import { DragTypes } from '../../utils/dnd';
import BasicModal from '../basicModal';
import styles from './CollectionView.module.css';
import MoveableHeader from './MoveableHeader';
import MoveableRequest, { RequestDragItem } from './MoveableRequest';
import MoveableScript from './MoveableScript';

type CollectionProps = {
  collection: SidebarCollection;
  currentCollectionId?: number;
  currentRequestId?: number;
  currentScriptId?: number;
  selectCollection: any;
  selectRequest: any;
  selectScript: any;
  index: number;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
  renderCollection: (collection: SidebarCollection, index: number) => any;
  moveCollection: (dragIndex: number, hoverIndex: number, newParentId?: number) => void;
  isCollectionDescendant: (collectionId: number, ancestorId: number) => boolean;
  deleteScript: (id: number) => void;
  duplicateScript: (id: number, newName: string) => void;
};

function CollectionView({
  collection,
  currentRequestId,
  currentCollectionId,
  currentScriptId,
  selectCollection,
  selectRequest,
  selectScript,
  index,
  renameRequest,
  deleteRequest,
  duplicateRequest,
  duplicateCollection,
  dispatchCollections,
  renderCollection,
  moveCollection,
  isCollectionDescendant,
  deleteScript,
  duplicateScript,
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

  const moveScript = useCallback(
    async (id: number, newRank: number, newCollectionId: number) => {
      try {
        dispatchCollections({
          type: CollectionsActionType.MOVE_SCRIPT,
          id,
          newRank,
          newCollectionId,
        });
        const response = await api.moveScript(id, newRank, newCollectionId);
        if (response.status !== 200) throw new Error();
        successToast('Script was moved.', toast);
      } catch (e) {
        console.error(e);
        errorToast('Could not move script.', toast);
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
          selected={currentRequestId === request.id}
          selectRequest={selectRequest}
          renameRequest={renameRequest}
          deleteRequest={deleteRequest}
          duplicateRequest={duplicateRequest}
          dispatchCollections={dispatchCollections}
        />
      );
    },
    [
      collection.depth,
      moveRequest,
      currentRequestId,
      selectRequest,
      renameRequest,
      deleteRequest,
      duplicateRequest,
      dispatchCollections,
    ],
  );

  const renderScript = useCallback(
    (script: SidebarScript, index: number) => {
      return (
        <MoveableScript
          key={script.id}
          script={script}
          index={index}
          depth={collection.depth}
          moveScript={moveScript}
          selected={currentScriptId === script.id}
          selectScript={selectScript}
          deleteScript={deleteScript}
          duplicateScript={duplicateScript}
          dispatchCollections={dispatchCollections}
        />
      );
    },
    [
      collection.depth,
      currentScriptId,
      deleteScript,
      dispatchCollections,
      duplicateScript,
      moveScript,
      selectScript,
    ],
  );

  return (
    <>
      <MoveableHeader
        collection={collection}
        currentCollectionId={currentCollectionId}
        selectCollection={selectCollection}
        selectRequest={selectRequest}
        selectScript={selectScript}
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
        <div className={cn(styles, 'scripts', [...iconVariants, colorMode])}>
          {collection.scripts?.map((script, i) => renderScript(script, i))}
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
