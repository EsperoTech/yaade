import { createState, none, useHookstate } from '@hookstate/core';

import Collection from '../model/Collection';
import Request from '../model/Request';

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
