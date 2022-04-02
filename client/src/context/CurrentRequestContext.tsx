import {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from 'react';

import CurrentRequest from '../model/CurrentRequest';
import Request from '../model/Request';

const defaultRequest: CurrentRequest = {
  id: -1,
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
  isLoading: false,
  collectionId: -1,
  changed: false,
};

function parseRequest(request: Request): CurrentRequest {
  return {
    id: request.id,
    collectionId: request.collectionId,
    type: request.type,
    version: request.version,
    data: request.data,
    isLoading: false,
    changed: false,
  };
}

interface ICollectionContext {
  currentRequest: CurrentRequest;
  setCurrentRequest: Dispatch<SetStateAction<CurrentRequest>>;
  saveRequest: () => Promise<void>;
  saveNewRequest: (body: any) => Promise<Request>;
  changeCurrentRequest: (request: CurrentRequest) => void;
}

const CurrentRequestContext = createContext<ICollectionContext>({
  currentRequest: defaultRequest,
  setCurrentRequest: () => {},
  saveRequest: async () => {},
  saveNewRequest: async () => defaultRequest,
  changeCurrentRequest: () => {},
});

const CurrentRequestProvider: FunctionComponent = ({ children }) => {
  const [currentRequest, setCurrentRequest] = useState<CurrentRequest>(defaultRequest);

  function changeCurrentRequest(request: CurrentRequest) {
    setCurrentRequest({
      ...request,
      changed: true,
    });
  }

  async function _sendSaveRequest(method: string, body: any): Promise<Response> {
    const response = await fetch('/api/request', {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.status !== 200) throw new Error();
    return response;
  }

  async function saveRequest(): Promise<void> {
    await _sendSaveRequest('PUT', currentRequest);
  }

  async function saveNewRequest(body: any): Promise<Request> {
    const response = await _sendSaveRequest('POST', body);
    return (await response.json()) as Request;
  }

  return (
    <CurrentRequestContext.Provider
      value={{
        currentRequest,
        setCurrentRequest,
        saveRequest,
        saveNewRequest,
        changeCurrentRequest,
      }}
    >
      {children}
    </CurrentRequestContext.Provider>
  );
};

export { CurrentRequestContext, defaultRequest, parseRequest };

export default CurrentRequestProvider;
