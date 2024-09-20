import Script, { CurrentScript } from '../model/Script';

const defaultCurrentScript: CurrentScript | undefined = {
  id: -1,
  collectionId: -1,
  data: {},
  isChanged: false,
};

enum CurrentScriptActionType {
  SET = 'SET',
  UNSET = 'UNSET',
  SET_IS_CHANGED = 'SET_IS_CHANGED',
  PATCH_DATA = 'PATCH_DATA',
}

type SetAction = {
  type: CurrentScriptActionType.SET;
  script: Script;
};

type UnsetAction = {
  type: CurrentScriptActionType.UNSET;
};

type SetIsChangedAction = {
  type: CurrentScriptActionType.SET_IS_CHANGED;
  isChanged: boolean;
};

type PatchDataAction = {
  type: CurrentScriptActionType.PATCH_DATA;
  data: any;
};

function set(script: Script): CurrentScript {
  return {
    id: script.id,
    collectionId: script.collectionId,
    data: script.data,
    isChanged: false,
  };
}

function unset(): undefined {
  return undefined;
}

function setIsChanged(state: CurrentScript | undefined, isChanged: boolean) {
  if (!state) return state;
  return {
    ...state,
    isChanged,
  };
}

function patchData(state: CurrentScript | undefined, data: any) {
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

type CurrentScriptAction = SetAction | UnsetAction | PatchDataAction | SetIsChangedAction;

function currentScriptReducer(
  state: CurrentScript | undefined = defaultCurrentScript,
  action: CurrentScriptAction,
) {
  switch (action.type) {
    case CurrentScriptActionType.SET:
      return set(action.script);
    case CurrentScriptActionType.UNSET:
      return unset();
    case CurrentScriptActionType.PATCH_DATA:
      return patchData(state, action.data);
    case CurrentScriptActionType.SET_IS_CHANGED:
      return setIsChanged(state, action.isChanged);
    default:
      console.error('Invalid action type', action);
      return state;
  }
}

export type { CurrentScriptAction };

export { CurrentScriptActionType, currentScriptReducer, defaultCurrentScript };
