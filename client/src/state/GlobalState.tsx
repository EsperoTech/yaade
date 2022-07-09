import { createState, none, useHookstate } from '@hookstate/core';

import Collection from '../model/Collection';
import Request from '../model/Request';

const defaultRequest: Request = {
  id: -1,
  collectionId: -1,
  type: 'REST',
  version: '1.0.0',
  data: {
    name: '',
    uri: '',
    method: 'GET',
    params: [
      {
        key: '',
        value: '',
      },
    ],
    headers: [
      {
        key: '',
        value: '',
      },
    ],
    body: '',
  },
};

interface GlobalState {
  collections: Collection[];
  currentRequest: Request;
  requestChanged: boolean;
  requestLoading: boolean;
}

const state = createState<GlobalState>({
  collections: [],
  currentRequest: defaultRequest,
  requestChanged: false,
  requestLoading: false,
});

function writeRequestToCollections(request: Request) {
  const collectionIndex = state.collections.findIndex(
    (c) => c.id.get() === request.collectionId,
  );
  if (collectionIndex === -1) return;

  const requestIndex = state.collections[collectionIndex].requests.findIndex(
    (r) => r.id.get() === request.id,
  );
  if (requestIndex === -1) {
    state.collections[collectionIndex].requests.merge([request]);
  } else {
    state.collections[collectionIndex].requests[requestIndex].set(request);
  }
}

function removeRequest(request: Request) {
  const collectionIndex = state.collections.findIndex(
    (c) => c.id.get() === request.collectionId,
  );
  if (collectionIndex === -1) return;

  const requestIndex = state.collections[collectionIndex].requests.findIndex(
    (r) => r.id.get() === request.id,
  );
  if (requestIndex === -1) return;

  state.collections[collectionIndex].requests[requestIndex].set(none);
}

function removeCollection(collectionId: number) {
  const collectionIndex = state.collections.findIndex((c) => c.id.get() === collectionId);
  if (collectionIndex === -1) return;

  state.collections[collectionIndex].set(none);
}

function saveCollection(collection: Collection) {
  const collectionIndex = state.collections.findIndex(
    (c) => c.id.get() === collection.id,
  );

  if (collectionIndex === -1) {
    state.collections.merge([collection]);
  } else {
    state.collections[collectionIndex].set(collection);
  }
}

function setCurrentRequest(request: Request) {
  state.currentRequest.set(request);
}

export {
  defaultRequest,
  removeCollection,
  removeRequest,
  saveCollection,
  setCurrentRequest,
  writeRequestToCollections,
};

export function useGlobalState() {
  return useHookstate(state);
}
