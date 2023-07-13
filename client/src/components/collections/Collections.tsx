import { useToast } from '@chakra-ui/react';
import type { FC } from 'react';
import { useCallback } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Collection, { SidebarCollection } from '../../model/Collection';
import { moveCollection, xxx } from '../../state/GlobalState';
import { BASE_PATH, errorToast, successToast } from '../../utils';
import CollectionView from '../collectionView';
import styles from './Collections.module.css';
import MoveableCollection from './MoveableCollection';

type CollectionsProps = {
  collections: SidebarCollection[];
};

function Collections({ collections }: CollectionsProps) {
  const toast = useToast();

  const dragCollection = async (dragIndex: number, hoverIndex: number) => {
    const item = collections[dragIndex];
    moveCollection(dragIndex, hoverIndex);
    try {
      const res = await fetch(BASE_PATH + `api/collection/${item.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newRank: hoverIndex,
        }),
      });
      console.log(res);
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

export default Collections;
