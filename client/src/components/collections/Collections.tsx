import { useToast } from '@chakra-ui/react';
import { Dispatch, useCallback, useEffect } from 'react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import api from '../../api';
import { SidebarCollection } from '../../model/Collection';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import { errorToast, successToast } from '../../utils';
import CollectionView from '../collectionView';
import styles from './Collections.module.css';

type CollectionsProps = {
  collections: SidebarCollection[];
  currentCollectionId?: number;
  currentRequstId?: number;
  selectCollection: any;
  selectRequest: (requestId: number) => void;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
};

function Collections({
  collections,
  currentCollectionId,
  currentRequstId,
  selectCollection,
  selectRequest,
  renameRequest,
  deleteRequest,
  duplicateRequest,
  duplicateCollection,
  dispatchCollections,
}: CollectionsProps) {
  const toast = useToast();

  const findCollection = useCallback(
    (collections: SidebarCollection[], id: number): SidebarCollection | undefined => {
      for (const collection of collections) {
        if (collection.id === id) {
          return collection;
        }
        if (collection.children) {
          const res = findCollection(collection.children, id);
          if (res) return res;
        }
      }
      return undefined;
    },
    [],
  );

  const dragCollection = useCallback(
    async (id: number, newRank: number, newParentId?: number) => {
      const collection = findCollection(collections, id);
      if (!collection) return;
      if (collection.parentId === newParentId && collection.index === newRank) {
        console.log('No change');
        return;
      }
      dispatchCollections({
        type: CollectionsActionType.MOVE_COLLECTION,
        id,
        newRank,
        newParentId,
      });
      try {
        const res = await api.moveCollection(id, newRank, newParentId);
        if (res.status !== 200) throw new Error();
        successToast('Collection was moved.', toast);
      } catch (e) {
        dispatchCollections({
          type: CollectionsActionType.MOVE_COLLECTION,
          id,
          newRank: collection.index,
          newParentId: collection.parentId,
        });
        errorToast('Could not move collection.', toast);
      }
    },
    [collections, dispatchCollections, findCollection, toast],
  );

  const isCollectionDescendant = useCallback(
    (ancestorId: number, descendantId: number): boolean => {
      if (ancestorId === descendantId) return true;

      function isDescendant(cs: SidebarCollection[], visitedIds: number[] = []): boolean {
        for (const collection of cs) {
          if (collection.id === descendantId && visitedIds.includes(ancestorId)) {
            return true;
          }
          if (collection.children) {
            return isDescendant(collection.children, [...visitedIds, collection.id]);
          }
        }

        return false;
      }

      for (const collection of collections) {
        if (isDescendant(collection.children, [collection.id])) return true;
      }

      return false;
    },
    [collections],
  );

  const renderCollection = (collection: SidebarCollection) => {
    return (
      <CollectionView
        key={collection.id}
        collection={collection}
        currentCollectionId={currentCollectionId}
        currentRequstId={currentRequstId}
        selectCollection={selectCollection}
        index={collection.index}
        moveCollection={dragCollection}
        selectRequest={selectRequest}
        renameRequest={renameRequest}
        deleteRequest={deleteRequest}
        duplicateRequest={duplicateRequest}
        duplicateCollection={duplicateCollection}
        dispatchCollections={dispatchCollections}
        renderCollection={renderCollection}
        isCollectionDescendant={isCollectionDescendant}
      />
    );
  };

  return (
    <div className={styles.collections}>
      <DndProvider backend={HTML5Backend}>
        {collections.map(renderCollection)}
      </DndProvider>
    </div>
  );
}

export default React.memo(Collections);
