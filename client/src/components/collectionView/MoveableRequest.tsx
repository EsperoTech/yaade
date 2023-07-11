import { border } from '@chakra-ui/react';
import type { Identifier } from 'dnd-core';
import { useRef } from 'react';
import { useDrag, useDrop, XYCoord } from 'react-dnd';

import Request from '../../model/Request';
import { DragItem, DragTypes } from '../../utils/dnd';
import CollectionRequest from '../collectionRequest';

type MoveableRequestProps = {
  request: Request;
  moveRequest: (id: number, newRank?: number, newCollectionId?: number) => void;
  index: number;
};

export interface RequestDragItem extends DragItem {
  collectionId: number;
}

function MoveableRequest({ request, index, moveRequest }: MoveableRequestProps) {
  const id = request.id;
  const ref = useRef<HTMLDivElement>(null);
  const [{ handlerId, hoveredDownwards, hoveredUpwards }, drop] = useDrop<
    RequestDragItem,
    void,
    { handlerId: Identifier | null; hoveredDownwards: boolean; hoveredUpwards: boolean }
  >({
    accept: DragTypes.REQUEST,
    collect(monitor) {
      if (
        !ref.current ||
        !monitor ||
        !monitor.getItem() ||
        monitor.getItem().id === id ||
        // NOTE: we currently do not allow moving requests to a specific rank in a different collection.
        // The reasoning behind this is that there is currently no good way to determine if a request
        // should be dropped above or below the hovered request other than comparing the indices of the
        // hovered request and the dragged request. This is not possible if the requests are in different
        // collections.
        monitor.getItem().collectionId !== request.collectionId
      ) {
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
    drop(item: RequestDragItem) {
      if (item.index === index) {
        return;
      }
      moveRequest(item.id, index);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DragTypes.REQUEST,
    item: () => {
      return {
        id,
        index,
        type: DragTypes.REQUEST,
        collectionId: request.collectionId,
        requestId: request.id,
      };
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
    <div ref={ref} style={{ boxShadow, opacity, boxSizing: 'border-box' }}>
      <CollectionRequest request={request} data-handler-id={handlerId} />
    </div>
  );
}

export default MoveableRequest;
