export const DragTypes = {
  COLLECTION: 'collection',
  REQUEST: 'request',
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
