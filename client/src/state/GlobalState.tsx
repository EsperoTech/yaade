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
  console.log('writing req');
  const x = state.get({ noproxy: true });
  console.log('save', x);
  const collectionIndex = state.collections.findIndex(
    (c) => c.id.get() === request.collectionId,
  );
  console.log('writing req 1', collectionIndex);
  if (collectionIndex === -1) return;

  const requestIndex = state.collections[collectionIndex].requests.findIndex(
    (r) => r.id.get() === request.id,
  );
  console.log('writing req 2');
  if (requestIndex === -1) {
    console.log('writing req 3');
    state.collections[collectionIndex].requests.merge([
      JSON.parse(JSON.stringify(request)),
    ]);
  } else {
    console.log('writing req 4');
    state.collections[collectionIndex].requests[requestIndex].set(
      JSON.parse(JSON.stringify(request)),
    );
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

function setEnvVar(collectionId: number, envName?: string) {
  return (s: any, key: string, value: string) => {
    console.log('hello i am here', key, value, collectionId, envName);
    if (!envName) return;

    console.log('nope 0', s.collections.get({ noproxy: true }));

    const i = s.collections.findIndex((c: any) => c.id.get() === collectionId);
    if (i === -1) return;
    const collection = s.collections[i].get({ noproxy: true });

    console.log('nope 1');

    const envs = collection.data?.envs;
    if (!envs) return;

    console.log('nope 2');

    const newEnv = envs[envName];
    if (!newEnv) return;

    console.log('nope 3');

    newEnv.data[key] = value;

    const newCol = {
      ...collection,
      data: {
        ...collection.data,
        envs: {
          ...envs,
          [envName]: {
            ...newEnv,
          },
        },
      },
    };

    console.log('nnn', newCol);

    s.collections[i].set(collection);

    const x = s.get({ noproxy: true });
    console.log('sest', x);
  };
}

export {
  defaultRequest,
  removeCollection,
  removeRequest,
  saveCollection,
  setCurrentRequest,
  setEnvVar,
  writeRequestToCollections,
};

export function useGlobalState() {
  return useHookstate(state);
}
