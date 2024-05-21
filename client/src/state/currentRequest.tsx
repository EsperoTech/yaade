import Request, { CurrentRequest } from '../model/Request';

const defaultCurrentRequest: CurrentRequest | undefined = {
  id: -1,
  collectionId: -1,
  type: 'REST',
  version: '1.0.0',
  data: {
    name: '',
    uri: '',
    method: 'GET',
    headers: [
      {
        key: '',
        value: '',
      },
    ],
    body: '',
  },
  isChanged: false,
  isLoading: false,
};

enum CurrentRequestActionType {
  SET = 'SET',
  UNSET = 'UNSET',
  PATCH_DATA = 'PATCH_DATA',
  SET_IS_LOADING = 'SET_IS_LOADING',
  SET_IS_CHANGED = 'SET_IS_CHANGED',
  SET_CONTENT_TYPE_HEADER = 'SET_CONTENT_TYPE_HEADER',
}

type SetAction = {
  type: CurrentRequestActionType.SET;
  request: Request;
};

type UnsetAction = {
  type: CurrentRequestActionType.UNSET;
};

type PatchDataAction = {
  type: CurrentRequestActionType.PATCH_DATA;
  data: any;
};

type SetIsLoadingAction = {
  type: CurrentRequestActionType.SET_IS_LOADING;
  isLoading: boolean;
};

type SetIsChangedAction = {
  type: CurrentRequestActionType.SET_IS_CHANGED;
  isChanged: boolean;
};

type SetContentTypeHeader = {
  type: CurrentRequestActionType.SET_CONTENT_TYPE_HEADER;
  value: string;
};

function set(request: Request): CurrentRequest {
  return {
    id: request.id,
    collectionId: request.collectionId,
    type: request.type,
    version: request.version,
    data: request.data,
    isChanged: false,
    isLoading: false,
  };
}

function unset(): undefined {
  return undefined;
}

function patchData(state: CurrentRequest | undefined, data: any) {
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

function setIsLoading(state: CurrentRequest | undefined, isLoading: boolean) {
  if (!state) return state;
  return {
    ...state,
    isLoading,
  };
}

function setIsChanged(state: CurrentRequest | undefined, isChanged: boolean) {
  if (!state) return state;
  return {
    ...state,
    isChanged,
  };
}

function setContentTypeHeader(state: CurrentRequest | undefined, value: string) {
  if (!state) return state;
  let found = false;
  const headers = (state.data?.headers ?? []).map((header) => {
    if (header.key.toLowerCase() === 'content-type') {
      found = true;
      return {
        key: 'Content-Type',
        value,
      };
    }
    return header;
  });
  if (!found) {
    headers.push({
      key: 'Content-Type',
      value,
    });
  }
  return {
    ...state,
    data: {
      ...state.data,
      headers,
    },
  };
}

type CurrentRequestAction =
  | SetAction
  | UnsetAction
  | PatchDataAction
  | SetIsLoadingAction
  | SetIsChangedAction
  | SetContentTypeHeader;

function currentRequestReducer(
  state: CurrentRequest | undefined = defaultCurrentRequest,
  action: CurrentRequestAction,
) {
  switch (action.type) {
    case CurrentRequestActionType.SET:
      return set(action.request);
    case CurrentRequestActionType.UNSET:
      return unset();
    case CurrentRequestActionType.PATCH_DATA:
      return patchData(state, action.data);
    case CurrentRequestActionType.SET_IS_LOADING:
      return setIsLoading(state, action.isLoading);
    case CurrentRequestActionType.SET_IS_CHANGED:
      return setIsChanged(state, action.isChanged);
    case CurrentRequestActionType.SET_CONTENT_TYPE_HEADER:
      return setContentTypeHeader(state, action.value);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CurrentRequestAction };

export { CurrentRequestActionType, currentRequestReducer, defaultCurrentRequest };
