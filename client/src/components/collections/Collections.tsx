import type { FC } from 'react';
import { useCallback } from 'react';
import { DndProvider, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Collection from '../../model/Collection';
import { useGlobalState } from '../../state/GlobalState';
import CollectionView from '../collectionView';
import styles from './Collections.module.css';
import MoveableCollection from './MoveableCollection';

type CollectionsProps = {
  collections: Collection[];
};

function Collections({ collections }: CollectionsProps) {
  const globalState = useGlobalState();

  const moveCollection = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newCollections = collections.slice();
      const [item] = newCollections.splice(dragIndex, 1);
      newCollections.splice(hoverIndex, 0, item);
      globalState.collections.set(newCollections);
    },
    [collections, globalState.collections],
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
        <>
          {collections.map((collection: Collection, i) =>
            renderCollection(collection, i),
          )}
        </>
      </DndProvider>
    </div>
  );
}

export default Collections;
