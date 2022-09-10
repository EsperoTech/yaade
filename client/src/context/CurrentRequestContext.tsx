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
};

interface ICurrentRequestContext {
  currentRequest: Request | undefined;
  setCurrentRequest: Dispatch<SetStateAction<Request | undefined>>;
  isChanged: boolean;
  isLoading: boolean;
}

const CurrentRequestContext = createContext<ICurrentRequestContext>({
  currentRequest: defaultRequest,
  setCurrentRequest: () => {},
  isChanged: false,
  isLoading: false,
});

const CurrentRequestProvider: FunctionComponent = ({ children }) => {
  const [currentRequest, setCurrentRequest] = useState<Request>();

  return (
    <CurrentRequestContext.Provider
      value={{
        currentRequest,
        setCurrentRequest,
        isChanged: false,
        isLoading: false,
      }}
    >
      {children}
    </CurrentRequestContext.Provider>
  );
};

export { CurrentRequestContext };

export default CurrentRequestProvider;
