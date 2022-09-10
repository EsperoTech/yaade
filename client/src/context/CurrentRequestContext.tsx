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
  collectionId: -1,
};

interface ICollectionContext {
  currentRequest: Request;
  setCurrentRequest: Dispatch<SetStateAction<Request>>;
  isChanged: boolean;
  setIsChanged: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  saveRequest: () => Promise<void>;
  saveNewRequest: (body: any) => Promise<Request>;
}

const CurrentRequestContext = createContext<ICollectionContext>({
  currentRequest: defaultRequest,
  setCurrentRequest: () => {},
  isChanged: false,
  setIsChanged: () => {},
  isLoading: false,
  setIsLoading: () => {},
  saveRequest: async () => {},
  saveNewRequest: async () => defaultRequest,
});

const CurrentRequestProvider: FunctionComponent = ({ children }) => {
  const [currentRequest, setCurrentRequest] = useState<Request>(defaultRequest);
  const [isChanged, setIsChanged] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
        isChanged,
        setIsChanged,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </CurrentRequestContext.Provider>
  );
};

export { CurrentRequestContext, defaultRequest };

export default CurrentRequestProvider;
