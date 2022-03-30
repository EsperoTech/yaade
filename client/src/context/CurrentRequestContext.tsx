import {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from 'react';

import Request from '../model/Request';

const defaultRequest: Request = {
  id: -1,
  type: 'REST',
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

interface ICollectionContext {
  currentRequest: Request;
  setCurrentRequest: Dispatch<SetStateAction<Request>>;
  saveRequest: () => Promise<void>;
  saveNewRequest: (body: any) => Promise<Request>;
  changeCurrentRequest: (request: Request) => void;
}

const CurrentRequestContext = createContext<ICollectionContext>({
  currentRequest: defaultRequest,
  setCurrentRequest: () => {},
  saveRequest: async () => {},
  saveNewRequest: async () => defaultRequest,
  changeCurrentRequest: () => {},
});

const CurrentRequestProvider: FunctionComponent = ({ children }) => {
  const [currentRequest, setCurrentRequest] = useState<Request>(defaultRequest);

  function changeCurrentRequest(request: Request) {
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

export { CurrentRequestContext, defaultRequest };

export default CurrentRequestProvider;
