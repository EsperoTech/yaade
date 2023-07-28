import type { Identifier } from 'dnd-core';
import { Dispatch, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { SidebarCollection } from '../../model/Collection';
import { CollectionsAction } from '../../state/collections';
import { DragItem, DragTypes } from '../../utils/dnd';
import CollectionView from '../collectionView';

type MoveableCollectionProps = {
  collection: SidebarCollection;
  moveCollection: (dragIndex: number, hoverIndex: number) => void;
  index: number;
  currentCollectionId?: number;
  currentRequstId?: number;
  selectCollection: any;
  selectRequest: (requestId: number) => void;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
};

function MoveableCollection({
  collection,
  moveCollection,
  index,
  currentCollectionId,
  currentRequstId,
  selectCollection,
  selectRequest,
  renameRequest,
  deleteRequest,
  dispatchCollections,
}: MoveableCollectionProps) {
  const id = collection.id;
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId, hoveredDownwards, hoveredUpwards }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null; hoveredUpwards: boolean; hoveredDownwards: boolean }
  >({
    accept: DragTypes.COLLECTION,
    collect(monitor) {
      if (!ref.current || !monitor || !monitor.getItem() || monitor.getItem().id === id) {
        return {
          handlerId: null,
          hoveredDownwards: false,
          hoveredUpwards: false,
        };
      }
      const itemIndex = monitor.getItem().index;
      const hoveredUpwards = monitor.isOver() && itemIndex > index;
      const hoveredDownwards = monitor.isOver() && itemIndex < index;
      return {
        handlerId: monitor.getHandlerId(),
        hoveredDownwards,
        hoveredUpwards,
      };
    },
    drop(item: DragItem) {
      if (item.index === index) {
        return;
      }
      moveCollection(item.index, index);
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
  let boxShadow = 'none';
  if (hoveredDownwards) {
    boxShadow = '0 2px 0 var(--chakra-colors-green-500)';
  }
  if (hoveredUpwards) {
    boxShadow = '0 -2px 0 var(--chakra-colors-green-500)';
  }

  drag(drop(ref));
  return (
    <div ref={ref} style={{ opacity, boxShadow }} data-handler-id={handlerId}>
      <CollectionView
        collection={collection}
        currentRequstId={currentRequstId}
        currentCollectionId={currentCollectionId}
        selectCollection={selectCollection}
        selectRequest={selectRequest}
        renameRequest={renameRequest}
        deleteRequest={deleteRequest}
        dispatchCollections={dispatchCollections}
      />
    </div>
  );
}

export default MoveableCollection;
