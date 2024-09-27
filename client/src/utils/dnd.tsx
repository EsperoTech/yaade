export const DragTypes = {
  COLLECTION: 'collection',
  REQUEST: 'request',
  SCRIPT: 'script',
};

export const DropTypes = {
  COLLECTION: 'collection',
};

export interface DragItem {
  index: number;
  id: number;
  type: string;
  parentId?: number;
}
