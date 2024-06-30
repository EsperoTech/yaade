import { border } from '@chakra-ui/react';
import type { Identifier } from 'dnd-core';
import React, { Dispatch, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop, XYCoord } from 'react-dnd';

import { SidebarRequest } from '../../model/Request';
import { CollectionsAction } from '../../state/collections';
import { DragItem, DragTypes } from '../../utils/dnd';
import CollectionRequest from '../collectionRequest';

type MoveableRequestProps = {
  request: SidebarRequest;
  selected: boolean;
  moveRequest: (id: number, newRank: number, newCollectionId: number) => void;
  index: number;
  depth: number;
  selectRequest: any;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
};

export interface RequestDragItem extends DragItem {
  collectionId: number;
}

function calculateTopHoveredRank(
  hoverIndex: number,
  dragIndex: number,
  hoverCollectionId?: number,
  dragCollectionId?: number,
) {
  if (hoverCollectionId !== dragCollectionId) {
    return hoverIndex;
  }

  return hoverIndex < dragIndex ? hoverIndex : hoverIndex - 1;
}

function calculateBottomHoveredRank(
  hoverIndex: number,
  dragIndex: number,
  hoverCollectionId?: number,
  dragCollectionId?: number,
) {
  if (hoverCollectionId !== dragCollectionId) {
    return hoverIndex + 1;
  }

  return hoverIndex < dragIndex ? hoverIndex + 1 : hoverIndex;
}

function MoveableRequest({
  request,
  index,
  depth,
  selected,
  moveRequest,
  selectRequest,
  renameRequest,
  deleteRequest,
  duplicateRequest,
  dispatchCollections,
}: MoveableRequestProps) {
  const id = request.id;
  const ref = useRef<HTMLDivElement>(null);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);
  const [{ handlerId }, drop] = useDrop<
    RequestDragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: DragTypes.REQUEST,
    hover(item, monitor) {
      if (!ref.current || !monitor.isOver()) {
        return;
      }

      if (!ref.current || !monitor || !item || item.id === id) {
        return {
          handlerId: null,
          hoveredDownwards: false,
          hoveredUpwards: false,
        };
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      const hoveredTop = hoverClientY < hoverBoundingRect.height / 2;
      const hoveredBottom = hoverClientY > hoverBoundingRect.height / 2;

      if (hoveredTop) {
        const newRank = calculateTopHoveredRank(
          index,
          item.index,
          request.collectionId,
          item.collectionId,
        );
        if (newRank === item.index && item.collectionId === request.collectionId) {
          return;
        }
      }

      if (hoveredBottom) {
        const newRank = calculateBottomHoveredRank(
          index,
          item.index,
          request.collectionId,
          item.collectionId,
        );
        if (newRank === item.index && item.collectionId === request.collectionId) {
          return;
        }
      }

      setIsTopHovered(hoveredTop);
      setIsBottomHovered(hoveredBottom);
    },
    collect(monitor) {
      if (!ref.current || !monitor || !monitor.getItem() || monitor.getItem().id === id) {
        setIsTopHovered(false);
        setIsBottomHovered(false);
        return {
          handlerId: null,
        };
      }
      if (!monitor.isOver()) {
        setIsTopHovered(false);
        setIsBottomHovered(false);
      }
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    drop(item: RequestDragItem) {
      let newRank: number;
      if (isTopHovered) {
        newRank = calculateTopHoveredRank(
          index,
          item.index,
          request.collectionId,
          item.collectionId,
        );
      } else if (isBottomHovered) {
        newRank = calculateBottomHoveredRank(
          index,
          item.index,
          request.collectionId,
          item.collectionId,
        );
      } else {
        return;
      }
      if (item.index === newRank && item.collectionId === request.collectionId) {
        return;
      }
      moveRequest(item.id, newRank, request.collectionId);
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
  const boxShadow = useMemo(() => {
    if (isBottomHovered) {
      return '0 2px 0 var(--chakra-colors-green-500)';
    }
    if (isTopHovered) {
      return 'inset 0 2px 0 var(--chakra-colors-green-500)';
    }
    return 'none';
  }, [isBottomHovered, isTopHovered]);

  drag(drop(ref));
  return (
    <div ref={ref} style={{ boxShadow, opacity, boxSizing: 'border-box' }}>
      <CollectionRequest
        request={request}
        data-handler-id={handlerId}
        selected={selected}
        selectRequest={selectRequest}
        depth={depth}
        dispatchCollections={dispatchCollections}
        renameRequest={renameRequest}
        deleteRequest={deleteRequest}
        duplicateRequest={duplicateRequest}
      />
    </div>
  );
}

// NOTE: the unnecessary rerender of all requests caused a lot of performance issues.
export default React.memo(MoveableRequest, (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.request.id === nextProps.request.id &&
    prevProps.request.name === nextProps.request.name &&
    prevProps.request.collectionId === nextProps.request.collectionId &&
    prevProps.request.method === nextProps.request.method &&
    prevProps.index === nextProps.index &&
    prevProps.deleteRequest === nextProps.deleteRequest &&
    prevProps.renameRequest === nextProps.renameRequest &&
    prevProps.selectRequest === nextProps.selectRequest &&
    prevProps.moveRequest === nextProps.moveRequest
  );
});
