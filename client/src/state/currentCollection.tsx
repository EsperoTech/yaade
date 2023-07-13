import Collection, { CurrentCollection } from '../model/Collection';

const defaultCurrentCollection: CurrentCollection | undefined = {
  id: -1,
  data: {},
  isChanged: false,
};

enum CurrentCollectionActionType {
  SET = 'SET',
  SET_NAME = 'SET_NAME',
  SET_IS_CHANGED = 'SET_IS_CHANGED',
  SET_DESCRIPTION = 'SET_DESCRIPTION',
  SET_ENVS = 'SET_ENVS',
}

type SetAction = {
  type: CurrentCollectionActionType.SET;
  collection: Collection;
};

type SetNameAction = {
  type: CurrentCollectionActionType.SET_NAME;
  name: string;
};

type SetIsChangedAction = {
  type: CurrentCollectionActionType.SET_IS_CHANGED;
  isChanged: boolean;
};

type SetDescriptionAction = {
  type: CurrentCollectionActionType.SET_DESCRIPTION;
  description: string;
};

type SetEnvsAction = {
  type: CurrentCollectionActionType.SET_ENVS;
  envs: any;
};

function set(collection: Collection) {
  return {
    id: collection.id,
    data: collection.data,
    isChanged: false,
  };
}

function setData(
  state: CurrentCollection | undefined,
  data: any,
): CurrentCollection | undefined {
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

function setName(
  state: CurrentCollection | undefined,
  name: string,
): CurrentCollection | undefined {
  return setData(state, { name });
}

function setIsChanged(
  state: CurrentCollection | undefined,
  isChanged: boolean,
): CurrentCollection | undefined {
  if (!state) return state;
  return {
    ...state,
    isChanged: isChanged,
  };
}

function setDescription(
  state: CurrentCollection | undefined,
  description: string,
): CurrentCollection | undefined {
  return setData(state, { description });
}

function setEnvs(
  state: CurrentCollection | undefined,
  envs: any,
): CurrentCollection | undefined {
  return setData(state, { envs });
}

type CurrentCollectionAction =
  | SetAction
  | SetNameAction
  | SetIsChangedAction
  | SetDescriptionAction
  | SetEnvsAction;

function currentCollectionReducer(
  state: CurrentCollection | undefined = defaultCurrentCollection,
  action: CurrentCollectionAction,
) {
  switch (action.type) {
    case CurrentCollectionActionType.SET:
      return set(action.collection);
    case CurrentCollectionActionType.SET_NAME:
      return setName(state, action.name);
    case CurrentCollectionActionType.SET_IS_CHANGED:
      return setIsChanged(state, action.isChanged);
    case CurrentCollectionActionType.SET_DESCRIPTION:
      return setDescription(state, action.description);
    case CurrentCollectionActionType.SET_ENVS:
      return setEnvs(state, action.envs);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CurrentCollectionAction };

export {
  CurrentCollectionActionType,
  currentCollectionReducer,
  defaultCurrentCollection,
};
