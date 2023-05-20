import { useToast } from '@chakra-ui/react';
import type { FC } from 'react';
import { useCallback } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Collection from '../../model/Collection';
import { useGlobalState } from '../../state/GlobalState';
import { BASE_PATH, errorToast, successToast } from '../../utils';
import CollectionView from '../collectionView';
import styles from './Collections.module.css';
import MoveableCollection from './MoveableCollection';

type CollectionsProps = {
  collections: Collection[];
};

function Collections({ collections }: CollectionsProps) {
  const globalState = useGlobalState();
  const toast = useToast();

  const moveCollection = useCallback(
    async (dragIndex: number, hoverIndex: number) => {
      const newCollections = collections.slice();
      if (
        dragIndex === hoverIndex ||
        dragIndex < 0 ||
        hoverIndex < 0 ||
        dragIndex >= newCollections.length ||
        hoverIndex >= newCollections.length
      ) {
        console.error('Invalid moveCollection call');
        return;
      }
      const [item] = newCollections.splice(dragIndex, 1);
      newCollections.splice(hoverIndex, 0, item);
      globalState.collections.set(newCollections);
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
    },
    [collections, globalState, toast],
  );

  const renderCollection = useCallback(
    (collection: Collection, index: number) => {
      return (
        <MoveableCollection
          key={collection.id}
          collection={collection}
          index={index}
          moveCollection={moveCollection}
        />
      );
    },
    [moveCollection],
  );

  return (
    <div className={styles.collections}>
      <DndProvider backend={HTML5Backend}>
        {collections.map((collection: Collection, i) => renderCollection(collection, i))}
      </DndProvider>
    </div>
  );
}

export default Collections;
