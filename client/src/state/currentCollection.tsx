import Collection, { CurrentCollection } from '../model/Collection';

const defaultCurrentCollection: CurrentCollection | undefined = {
  id: -1,
  ownerId: -1,
  version: '1.0.0',
  data: {},
  isChanged: false,
};

enum CurrentCollectionActionType {
  SET = 'SET',
  UNSET = 'UNSET',
  SET_IS_CHANGED = 'SET_IS_CHANGED',
  PATCH_DATA = 'PATCH_DATA',
}

type SetAction = {
  type: CurrentCollectionActionType.SET;
  collection: Collection;
};

type UnsetAction = {
  type: CurrentCollectionActionType.UNSET;
};

type SetIsChangedAction = {
  type: CurrentCollectionActionType.SET_IS_CHANGED;
  isChanged: boolean;
};

type PatchDataAction = {
  type: CurrentCollectionActionType.PATCH_DATA;
  data: any;
};

function set(collection: Collection): CurrentCollection {
  return {
    id: collection.id,
    ownerId: collection.ownerId,
    version: collection.version,
    data: collection.data,
    isChanged: false,
  };
}

function unset(): undefined {
  return undefined;
}

function setIsChanged(state: CurrentCollection | undefined, isChanged: boolean) {
  if (!state) return state;
  return {
    ...state,
    isChanged,
  };
}

function patchData(state: CurrentCollection | undefined, data: any) {
  if (!state) return state;
  return {
    ...state,
    data: {
      ...state.data,
      ...data,
    },
    isChanged: true,
  };
}

type CurrentCollectionAction =
  | SetAction
  | UnsetAction
  | PatchDataAction
  | SetIsChangedAction;

function currentCollectionReducer(
  state: CurrentCollection | undefined = defaultCurrentCollection,
  action: CurrentCollectionAction,
): CurrentCollection | undefined {
  switch (action.type) {
    case CurrentCollectionActionType.SET:
      return set(action.collection);
    case CurrentCollectionActionType.UNSET:
      return unset();
    case CurrentCollectionActionType.PATCH_DATA:
      return patchData(state, action.data);
    case CurrentCollectionActionType.SET_IS_CHANGED:
      return setIsChanged(state, action.isChanged);
    default:
      console.error('Invalid action type', action);
      return state;
  }
}

export type { CurrentCollectionAction };

export {
  CurrentCollectionActionType,
  currentCollectionReducer,
  defaultCurrentCollection,
};
