import { border } from '@chakra-ui/react';
import type { Identifier } from 'dnd-core';
import React, { Dispatch, useMemo, useRef, useState } from 'react';
import { useDrag, useDrop, XYCoord } from 'react-dnd';

import { SidebarScript } from '../../model/Script';
import { CollectionsAction } from '../../state/collections';
import { DragItem, DragTypes } from '../../utils/dnd';
import CollectionScript from '../collectionScript';

type MoveableScriptProps = {
  script: SidebarScript;
  selected: boolean;
  moveScript: (id: number, newRank: number, newCollectionId: number) => void;
  index: number;
  depth: number;
  selectScript: any;
  deleteScript: (id: number) => void;
  duplicateScript: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
};

export interface ScriptDragItem extends DragItem {
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

function MoveableScript({
  script,
  index,
  depth,
  selected,
  moveScript,
  selectScript,
  deleteScript,
  duplicateScript,
  dispatchCollections,
}: MoveableScriptProps) {
  const id = script.id;
  const ref = useRef<HTMLDivElement>(null);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);
  const [{ handlerId }, drop] = useDrop<
    ScriptDragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: DragTypes.SCRIPT,
    hover(item, monitor) {
      if (!ref.current || !monitor.isOver()) {
        return;
      }

      if (selected) {
        console.log('SSELECTED');
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
          script.collectionId,
          item.collectionId,
        );
        if (newRank === item.index && item.collectionId === script.collectionId) {
          return;
        }
      }

      if (hoveredBottom) {
        const newRank = calculateBottomHoveredRank(
          index,
          item.index,
          script.collectionId,
          item.collectionId,
        );
        if (newRank === item.index && item.collectionId === script.collectionId) {
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
    drop(item: ScriptDragItem) {
      let newRank: number;
      if (isTopHovered) {
        newRank = calculateTopHoveredRank(
          index,
          item.index,
          script.collectionId,
          item.collectionId,
        );
      } else if (isBottomHovered) {
        newRank = calculateBottomHoveredRank(
          index,
          item.index,
          script.collectionId,
          item.collectionId,
        );
      } else {
        return;
      }
      if (item.index === newRank && item.collectionId === script.collectionId) {
        return;
      }
      moveScript(item.id, newRank, script.collectionId);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DragTypes.SCRIPT,
    item: () => {
      return {
        id,
        index,
        type: DragTypes.SCRIPT,
        collectionId: script.collectionId,
        scriptId: script.id,
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
      <CollectionScript
        script={script}
        data-handler-id={handlerId}
        selected={selected}
        selectScript={selectScript}
        depth={depth}
        dispatchCollections={dispatchCollections}
        deleteScript={deleteScript}
        duplicateScript={duplicateScript}
      />
    </div>
  );
}

// NOTE: the unnecessary rerender of all scripts caused a lot of performance issues.
export default React.memo(MoveableScript, (prevProps, nextProps) => {
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.script.id === nextProps.script.id &&
    prevProps.script.name === nextProps.script.name &&
    prevProps.script.collectionId === nextProps.script.collectionId &&
    prevProps.index === nextProps.index &&
    prevProps.deleteScript === nextProps.deleteScript &&
    prevProps.selectScript === nextProps.selectScript &&
    prevProps.moveScript === nextProps.moveScript
  );
});
