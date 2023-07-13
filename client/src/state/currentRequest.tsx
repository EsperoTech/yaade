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
  SET_NAME = 'SET_NAME',
}

type SetCurrentRequestAction = {
  type: CurrentRequestActionType.SET;
  request: Request;
};

function setCurrentRequest(request: Request) {
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

type SetCurrentRequestNameAction = {
  type: CurrentRequestActionType.SET_NAME;
  name: string;
};

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

type CurrentRequestAction = SetCurrentRequestAction | SetCurrentRequestNameAction;

function currentRequestReducer(
  state: CurrentRequest | undefined = defaultCurrentRequest,
  action: CurrentRequestAction,
) {
  switch (action.type) {
    case CurrentRequestActionType.SET:
      return setCurrentRequest(action.request);
    case CurrentRequestActionType.SET_NAME:
      return setCurrentRequestName(state, action.name);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CurrentRequestAction };

export { CurrentRequestActionType, currentRequestReducer, defaultCurrentRequest };
