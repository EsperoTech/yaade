import Collection, { CurrentCollection } from '../model/Collection';

const defaultCollections: Collection[] = [];

enum CollectionsActionType {
  SET = 'SET',
  ADD = 'ADD',
  WRITE_CURRENT_COLLECTION = 'WRITE_CURRENT_COLLECTION',
}

type SetCollectionsAction = {
  type: CollectionsActionType.SET;
  collections: Collection[];
};

type AddCollectionAction = {
  type: CollectionsActionType.ADD;
  collection: Collection;
};

type WriteCurrentCollectionAction = {
  type: CollectionsActionType.WRITE_CURRENT_COLLECTION;
  collection: CurrentCollection;
};

function set(collections: Collection[]): Collection[] {
  return collections;
}

function add(state: Collection[], collection: Collection): Collection[] {
  return [...state, collection];
}

function writeCurrentCollection(
  state: Collection[],
  collection: CurrentCollection,
): Collection[] {
  const collectionIndex = state.findIndex((c) => c.id === collection.id);
  if (collectionIndex === -1) {
    return state;
  }

  const newState = [...state];
  newState[collectionIndex].data = { ...collection.data };

  return newState;
}

type CollectionsAction =
  | SetCollectionsAction
  | AddCollectionAction
  | WriteCurrentCollectionAction;

function collectionsReducer(
  state: Collection[] = defaultCollections,
  action: CollectionsAction,
) {
  switch (action.type) {
    case CollectionsActionType.SET:
      return set(action.collections);
    case CollectionsActionType.ADD:
      return add(state, action.collection);
    case CollectionsActionType.WRITE_CURRENT_COLLECTION:
      return writeCurrentCollection(state, action.collection);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CollectionsAction };

export { CollectionsActionType, collectionsReducer, defaultCollections };
