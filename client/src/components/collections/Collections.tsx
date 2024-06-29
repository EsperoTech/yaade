import { useToast } from '@chakra-ui/react';
import { Dispatch, useEffect } from 'react';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import api from '../../api';
import { SidebarCollection } from '../../model/Collection';
import {
  CollectionsAction,
  CollectionsActionType,
  findCollection,
} from '../../state/collections';
import { errorToast, successToast } from '../../utils';
import styles from './Collections.module.css';
import MoveableCollection from './MoveableCollection';

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

  const dragCollection = async (id: number, newRank: number, newParentId?: number) => {
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
      errorToast('Could not move collection.', toast);
    }
  };

  const renderCollection = (collection: SidebarCollection, index: number) => {
    return (
      <MoveableCollection
        key={collection.id}
        collection={collection}
        index={index}
        moveCollection={dragCollection}
        currentCollectionId={currentCollectionId}
        currentRequstId={currentRequstId}
        selectCollection={selectCollection}
        selectRequest={selectRequest}
        renameRequest={renameRequest}
        deleteRequest={deleteRequest}
        duplicateRequest={duplicateRequest}
        duplicateCollection={duplicateCollection}
        dispatchCollections={dispatchCollections}
        renderCollection={renderCollection}
      />
    );
  };

  return (
    <div className={styles.collections}>
      <DndProvider backend={HTML5Backend}>
        {collections.map((collection: SidebarCollection, i) =>
          renderCollection(collection, i),
        )}
      </DndProvider>
    </div>
  );
}

export default React.memo(Collections);
