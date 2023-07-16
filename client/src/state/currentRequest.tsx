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
  isChanged: false,
  isLoading: false,
};

enum CurrentRequestActionType {
  SET = 'SET',
  UNSET = 'UNSET',
  SET_NAME = 'SET_NAME',
}

type SetAction = {
  type: CurrentRequestActionType.SET;
  request: Request;
};

type UnsetAction = {
  type: CurrentRequestActionType.UNSET;
};

type SetNameAction = {
  type: CurrentRequestActionType.SET_NAME;
  name: string;
};

function set(request: Request | undefined): CurrentRequest | undefined {
  if (!request) return request;
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

function setCurrentRequestName(state: CurrentRequest | undefined, name: string) {
  if (!state) return state;
  return {
    ...state,
    data: {
      ...state.data,
      name: name,
    },
    isChanged: true,
  };
}

type CurrentRequestAction = SetAction | UnsetAction | SetNameAction;

function currentRequestReducer(
  state: CurrentRequest | undefined = defaultCurrentRequest,
  action: CurrentRequestAction,
) {
  switch (action.type) {
    case CurrentRequestActionType.SET:
      return set(action.request);
    case CurrentRequestActionType.UNSET:
      return unset();
    case CurrentRequestActionType.SET_NAME:
      return setCurrentRequestName(state, action.name);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CurrentRequestAction };

export { CurrentRequestActionType, currentRequestReducer, defaultCurrentRequest };
