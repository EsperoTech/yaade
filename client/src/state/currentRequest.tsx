import {
  CurrentRestRequest,
  CurrentWebsocketRequest,
  RestRequest,
  RestRequestData,
  WebsocketRequest,
  WebsocketRequestData,
} from '../model/Request';
import { WebsocketResponseMessage } from '../model/Response';

const defaultCurrentRequest: CurrentRestRequest | undefined = {
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
  ADD_WEBSOCKET_RESPONSE_MESSAGE = 'ADD_WEBSOCKET_RESPONSE_MESSAGE',
  CLEAR_WEBSOCKET_RESPONSE_MESSAGES = 'CLEAR_WEBSOCKET_RESPONSE_MESSAGES',
}

type SetAction = {
  type: CurrentRequestActionType.SET;
  request: RestRequest | WebsocketRequest;
};

type UnsetAction = {
  type: CurrentRequestActionType.UNSET;
};

type PatchDataAction = {
  type: CurrentRequestActionType.PATCH_DATA;
  data: RestRequestData | WebsocketRequestData;
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

type AddWebsocketResponseMessage = {
  type: CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE;
  message: WebsocketResponseMessage;
};

type ClearWebsocketResponseMessages = {
  type: CurrentRequestActionType.CLEAR_WEBSOCKET_RESPONSE_MESSAGES;
};

function set(
  request: RestRequest | WebsocketRequest,
): CurrentRestRequest | CurrentWebsocketRequest {
  const currentRequest = {
    id: request.id,
    collectionId: request.collectionId,
    version: request.version,
  };
  switch (request.type) {
    case 'REST':
      return {
        ...currentRequest,
        type: 'REST',
        data: request.data as RestRequestData,
        isChanged: false,
        isLoading: false,
      };
    case 'WS':
      return {
        ...currentRequest,
        type: 'WS',
        data: request.data as WebsocketRequestData,
        isChanged: false,
        state: 'disconnected',
      };
  }
}

function unset(): undefined {
  return undefined;
}

function patchData(
  state: CurrentRestRequest | CurrentWebsocketRequest | undefined,
  data: RestRequestData | WebsocketRequestData,
): CurrentRestRequest | CurrentWebsocketRequest | undefined {
  if (!state) return state;
  return {
    ...state,
    data: {
      ...state.data,
      ...data,
    },
    isChanged: true,
  } as CurrentRestRequest | CurrentWebsocketRequest;
}

function setIsLoading(
  state: CurrentRestRequest | CurrentWebsocketRequest | undefined,
  isLoading: boolean,
) {
  if (!state) return state;
  if (state.type !== 'REST') return state;
  return {
    ...state,
    isLoading,
  };
}

function setIsChanged(
  state: CurrentRestRequest | CurrentWebsocketRequest | undefined,
  isChanged: boolean,
) {
  if (!state) return state;
  return {
    ...state,
    isChanged,
  };
}

function setContentTypeHeader(
  state: CurrentRestRequest | CurrentWebsocketRequest | undefined,
  value: string,
) {
  if (!state) return state;
  if (state.type !== 'REST') return state;
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

function addWebsocketResponseMessage(
  state: CurrentWebsocketRequest | CurrentRestRequest | undefined,
  message: WebsocketResponseMessage,
) {
  if (!state) return state;
  if (state.type !== 'WS') return state;
  const newMessages = [message, ...(state.data.response?.messages ?? [])];
  console.log('newMessages', newMessages.length);
  if (newMessages.length > 100) {
    newMessages.pop();
  }
  return {
    ...state,
    data: {
      ...state.data,
      response: {
        ...state.data.response,
        messages: newMessages,
      },
    },
  };
}

function clearWebsocketResponseMessages(
  state: CurrentWebsocketRequest | CurrentRestRequest | undefined,
) {
  if (!state) return state;
  if (state.type !== 'WS') return state;
  return {
    ...state,
    data: {
      ...state.data,
      response: {
        ...state.data.response,
        messages: [],
      },
    },
  };
}

type CurrentRequestAction =
  | SetAction
  | UnsetAction
  | PatchDataAction
  | SetIsLoadingAction
  | SetIsChangedAction
  | SetContentTypeHeader
  | AddWebsocketResponseMessage
  | ClearWebsocketResponseMessages;

function currentRequestReducer(
  state: CurrentRestRequest | CurrentWebsocketRequest | undefined = defaultCurrentRequest,
  action: CurrentRequestAction,
): CurrentRestRequest | CurrentWebsocketRequest | undefined {
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
    case CurrentRequestActionType.ADD_WEBSOCKET_RESPONSE_MESSAGE:
      return addWebsocketResponseMessage(state, action.message);
    case CurrentRequestActionType.CLEAR_WEBSOCKET_RESPONSE_MESSAGES:
      return clearWebsocketResponseMessages(state);
    default:
      console.error('Invalid action type');
      return state;
  }
}

export type { CurrentRequestAction };

export { CurrentRequestActionType, currentRequestReducer, defaultCurrentRequest };
