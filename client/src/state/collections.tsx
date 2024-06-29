import Collection from '../model/Collection';
import Request from '../model/Request';

const defaultCollections: Collection[] = [];

function findCollection(collections: Collection[], id: number): Collection | undefined {
  for (const collection of collections) {
    if (collection.id === id) {
      return collection;
    }
    return findCollection(collection.children, id);
  }
  return undefined;
}

function findRequest(collections: Collection[], id: number): Request | undefined {
  for (const collection of collections) {
    for (const request of collection.requests) {
      if (request.id === id) {
        return request;
      }
    }
    if (collection.children) {
      const r = findRequest(collection.children, id);
      if (r) return r;
    }
  }
  return undefined;
}

// CAUTION: any visible mutation of state needs to return a new array,
// otherwise react will not rerender the component.
enum CollectionsActionType {
  SET = 'SET',
  ADD_COLLECTION = 'ADD_COLLECTION',
  PATCH_COLLECTION_DATA = 'PATCH_COLLECTION_DATA',
  DELETE_COLLECTION = 'DELETE_COLLECTION',
  MOVE_COLLECTION = 'MOVE_COLLECTION',
  ADD_REQUEST = 'ADD_REQUEST',
  PATCH_REQUEST_DATA = 'PATCH_REQUEST_DATA',
  DELETE_REQUEST = 'DELETE_REQUEST',
  MOVE_REQUEST = 'MOVE_REQUEST',
  CHANGE_REQUEST_COLLECTION = 'CHANGE_REQUEST_COLLECTION',
  CLOSE_ALL = 'CLOSE_ALL',
  TOGGLE_OPEN_COLLECTION = 'TOGGLE_OPEN_COLLECTION',
  SET_ENV_VAR = 'SET_ENV_VAR',
}

type SetCollectionsAction = {
  type: CollectionsActionType.SET;
  collections: Collection[];
};

type AddCollectionAction = {
  type: CollectionsActionType.ADD_COLLECTION;
  collection: Collection;
};

type PatchUpdateCollectionDataAction = {
  type: CollectionsActionType.PATCH_COLLECTION_DATA;
  id: number;
  data: any;
};

type DeleteCollectionAction = {
  type: CollectionsActionType.DELETE_COLLECTION;
  id: number;
};

type MoveCollectionAction = {
  type: CollectionsActionType.MOVE_COLLECTION;
  id: number;
  newRank: number;
  newParentId: number;
};

type AddRequestAction = {
  type: CollectionsActionType.ADD_REQUEST;
  request: Request;
};

type PatchRequestDataAction = {
  type: CollectionsActionType.PATCH_REQUEST_DATA;
  id: number;
  data: any;
};

type DeleteRequestAction = {
  type: CollectionsActionType.DELETE_REQUEST;
  id: number;
};

type MoveRequestAction = {
  type: CollectionsActionType.MOVE_REQUEST;
  id: number;
  newRank: number;
};

type ChangeRequestCollectionAction = {
  type: CollectionsActionType.CHANGE_REQUEST_COLLECTION;
  id: number;
  newCollectionId: number;
};

type CloseAllAction = {
  type: CollectionsActionType.CLOSE_ALL;
};

type ToggleOpenCollectionAction = {
  type: CollectionsActionType.TOGGLE_OPEN_COLLECTION;
  id: number;
};

type SetEnvVarPayload = {
  collectionId: number;
  envName: string;
  key: string;
  value: string;
};

type SetEnvVar = {
  type: CollectionsActionType.SET_ENV_VAR;
  payload: SetEnvVarPayload;
};

function modifyCollection(state: Collection[], id: number, f: (c: Collection) => void) {
  const s = JSON.parse(JSON.stringify(state));
  mod(s, id, f);
  return s;
}

function mod(collections: Collection[], id: number, f: (c: Collection) => void) {
  for (let i = 0; i < collections.length; i++) {
    if (collections[i].id === id) {
      f(collections[i]);
      return;
    }
    if (collections[i].children) {
      mod(collections[i].children, id, f);
    }
  }
}

function modifyRequest(collections: Collection[], id: number, f: (r: Request) => void) {
  return modifyCollection(collections, id, (c) => {
    for (let i = 0; i < c.requests.length; i++) {
      if (c.requests[i].id === id) {
        f(c.requests[i]);
        return;
      }
    }
  });
}

function set(collections: Collection[]): Collection[] {
  return collections;
}

function addCollection(state: Collection[], collection: Collection): Collection[] {
  return [...state, collection];
}

function patchCollectionData(
  state: Collection[],
  collectionId: number,
  data: any,
): Collection[] {
  return modifyCollection(state, collectionId, (c) => {
    c.data = { ...c.data, ...data };
  });
}

function deleteCollection(state: Collection[], id: number): Collection[] {
  return state.filter((c) => c.id !== id);
}

function moveCollection(
  state: Collection[],
  id: number,
  rank: number,
  parentId: number,
): Collection[] {
  console.log('moveCollection', id, rank, parentId);
  const currentCollection = findCollection(state, id);
  if (!currentCollection) return state;

  const currentParentId = currentCollection.data.parentId;
  const isNewParentId = currentParentId === parentId;

  if (isNewParentId && currentParentId) {
    console.log('moveCollectionFromOldParentToNewParent');
    return moveCollectionFromOldParentToNewParent(state, id, currentParentId, parentId);
  }

  if (isNewParentId && !currentParentId) {
    console.log('moveCollectionFromTopToNewParent');
    const x = moveCollectionFromTopToNewParent(state, id, parentId);
    console.log('res', x);
    return x;
  }

  if (!isNewParentId && !currentParentId) {
    console.log('moveCollectionFromTopToTop');
    return moveCollectionFromTopToTop(state, id, rank);
  }

  if (!isNewParentId && currentParentId) {
    console.log('moveCollectionFromOldParentToTop');
    return moveCollectionFromOldParentToTop(state, id, rank, currentParentId);
  }

  return state;
}

function moveCollectionFromTopToTop(
  state: Collection[],
  id: number,
  newRank: number,
): Collection[] {
  const c = [...state];
  for (let i = 0; i < state.length; i++) {
    if (c[i].id === id) {
      const newState = [...state];
      const collection = newState.splice(i, 1)[0];
      newState.splice(newRank, 0, collection);
      return newState;
    }
  }

  return state;
}

function moveCollectionFromTopToNewParent(
  state: Collection[],
  id: number,
  newParentId: number,
): Collection[] {
  let i = state.findIndex((c) => c.id === newParentId);
  if (i === -1) return state;

  const newState = JSON.parse(JSON.stringify(state));
  const collection = newState.splice(i, 1)[0];

  console.log(id, newParentId);
  console.log(collection);

  if (!collection) return state;

  return modifyCollection(newState, newParentId, (c) => {
    c.children.splice(0, 0, collection);
  });
}

function moveCollectionFromOldParentToTop(
  state: Collection[],
  id: number,
  newRank: number,
  currentParentId: number,
): Collection[] {
  let collection = undefined;
  const res = modifyCollection(state, currentParentId, (c) => {
    const index = c.children.findIndex((child) => child.id === id);
    if (index === -1) return;

    collection = c.children.splice(index, 1)[0];
    c.children.splice(newRank, 0);
  });

  res.splice(newRank, 0, collection);

  return res;
}

function moveCollectionFromOldParentToNewParent(
  state: Collection[],
  id: number,
  currentParentId: number,
  newParentId: number,
): Collection[] {
  let collection: any = undefined;
  const res = modifyCollection(state, currentParentId, (c) => {
    const index = c.children.findIndex((child) => child.id === id);
    if (index === -1) return;

    collection = c.children.splice(index, 1)[0];
  });

  if (!collection) return state;

  return modifyCollection(res, newParentId, (c) => {
    c.children.splice(0, 0, collection);
  });
}

function addRequest(state: Collection[], request: Request): Collection[] {
  const newState = [...state];
  for (let collection of newState) {
    if (collection.id === request.collectionId) {
      collection.requests.push(request);
      return newState;
    }
  }
  return newState;
}

function patchRequestData(state: Collection[], id: number, data: any): Collection[] {
  const newState = [...state];
  for (const collection of newState) {
    for (const request of collection.requests) {
      if (request.id === id) {
        request.data = { ...request.data, ...data };
        return newState;
      }
    }
  }
  return newState;
}

function deleteRequest(state: Collection[], id: number): Collection[] {
  const newState = [...state];
  for (const collection of newState) {
    const index = collection.requests.findIndex((r) => r.id === id);
    if (index !== -1) {
      collection.requests.splice(index, 1);
      return newState;
    }
  }
  return newState;
}

function moveRequest(state: Collection[], id: number, newRank: number): Collection[] {
  const collectionIndex = state.findIndex((c) => c.requests.some((r) => r.id === id));
  if (collectionIndex === -1) return state;

  const requestIndex = state[collectionIndex].requests.findIndex((r) => r.id === id);

  const newState = [...state];
  const request = newState[collectionIndex].requests.splice(requestIndex, 1)[0];
  newState[collectionIndex].requests.splice(newRank, 0, request);

  return newState;
}

function changeRequestCollection(
  state: Collection[],
  id: number,
  newCollectionId: number,
): Collection[] {
  const oldCollectionIndex = state.findIndex((c) => c.requests.some((r) => r.id === id));
  if (oldCollectionIndex === -1) return state;

  const requestIndex = state[oldCollectionIndex].requests.findIndex((r) => r.id === id);

  const newCollectionIndex = state.findIndex((c) => c.id === newCollectionId);
  if (newCollectionIndex === -1) return state;

  const newState = [...state];
  const request = newState[oldCollectionIndex].requests.splice(requestIndex, 1)[0];
  newState[newCollectionIndex].requests.push(request);

  return newState;
}

function closeAll(state: Collection[]): Collection[] {
  return state.map((c) => ({ ...c, open: false }));
}

function toggleOpenCollection(state: Collection[], id: number): Collection[] {
  return modifyCollection(state, id, (c) => {
    c.open = !c.open;
  });
}

function setEnvVar(state: Collection[], payload: SetEnvVarPayload): Collection[] {
  const i = state.findIndex((c) => c.id === payload.collectionId);
  if (i === -1) return state;

  const newState = [...state];
  const collection = newState[i];

  const envs = collection.data?.envs;
  if (!envs) return state;

  const newEnv = envs[payload.envName];
  if (!newEnv) return state;

  newEnv.data[payload.key] = payload.value;

  const newCollection = {
    ...collection,
    data: {
      ...collection.data,
      envs: {
        ...envs,
        [payload.envName]: {
          ...newEnv,
        },
      },
    },
  };

  newState[i] = newCollection;

  return newState;
}

type CollectionsAction =
  | SetCollectionsAction
  | AddCollectionAction
  | PatchUpdateCollectionDataAction
  | DeleteCollectionAction
  | MoveCollectionAction
  | AddRequestAction
  | PatchRequestDataAction
  | DeleteRequestAction
  | MoveRequestAction
  | ChangeRequestCollectionAction
  | CloseAllAction
  | ToggleOpenCollectionAction
  | SetEnvVar;

function collectionsReducer(
  state: Collection[] = defaultCollections,
  action: CollectionsAction,
) {
  switch (action.type) {
    case CollectionsActionType.SET:
      return set(action.collections);
    case CollectionsActionType.ADD_COLLECTION:
      return addCollection(state, action.collection);
    case CollectionsActionType.PATCH_COLLECTION_DATA:
      return patchCollectionData(state, action.id, action.data);
    case CollectionsActionType.DELETE_COLLECTION:
      return deleteCollection(state, action.id);
    case CollectionsActionType.MOVE_COLLECTION:
      return moveCollection(state, action.id, action.newRank, action.newParentId);
    case CollectionsActionType.ADD_REQUEST:
      return addRequest(state, action.request);
    case CollectionsActionType.PATCH_REQUEST_DATA:
      return patchRequestData(state, action.id, action.data);
    case CollectionsActionType.DELETE_REQUEST:
      return deleteRequest(state, action.id);
    case CollectionsActionType.MOVE_REQUEST:
      return moveRequest(state, action.id, action.newRank);
    case CollectionsActionType.CHANGE_REQUEST_COLLECTION:
      return changeRequestCollection(state, action.id, action.newCollectionId);
    case CollectionsActionType.CLOSE_ALL:
      return closeAll(state);
    case CollectionsActionType.TOGGLE_OPEN_COLLECTION:
      return toggleOpenCollection(state, action.id);
    case CollectionsActionType.SET_ENV_VAR:
      return setEnvVar(state, action.payload);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CollectionsAction };

export {
  CollectionsActionType,
  collectionsReducer,
  defaultCollections,
  findCollection,
  findRequest,
};
