import type { Identifier } from 'dnd-core';
import { Dispatch, useMemo, useRef, useState } from 'react';
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
  duplicateRequest: (id: number, newName: string) => void;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
  renderCollection: (collection: SidebarCollection, index: number) => any;
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
  duplicateRequest,
  duplicateCollection,
  dispatchCollections,
  renderCollection,
}: MoveableCollectionProps) {
  const id = collection.id;
  const ref = useRef<HTMLDivElement>(null);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [isMiddleHovered, setIsMiddleHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);
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

      // check if the item is in the top or bottom 50%
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
    drop(item: DragItem) {
      if (item.index === index) {
        return;
      }
      if (isTopHovered) {
        return moveCollection(item.index, index);
      }
      if (isMiddleHovered) {
        return moveCollection(item.index, index);
      }
      if (isBottomHovered) {
        return moveCollection(item.index, index + 1);
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
      return '0 0 0 2px red';
    }
    if (isTopHovered) {
      return '0 -2px 0 var(--chakra-colors-green-500)';
    }
    return 'none';
  }, [isBottomHovered, isMiddleHovered, isTopHovered]);

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
        duplicateRequest={duplicateRequest}
        duplicateCollection={duplicateCollection}
        dispatchCollections={dispatchCollections}
        renderCollection={renderCollection}
      />
    </div>
  );
}

export default MoveableCollection;
