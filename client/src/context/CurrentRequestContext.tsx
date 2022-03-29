import {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from 'react';

import Request from '../../model/Request';

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
  selected: false,
};

interface ICollectionContext {
  currentRequest: Request;
  setCurrentRequest: Dispatch<SetStateAction<Request>>;
}

const CurrentRequestContext = createContext<ICollectionContext>({
  currentRequest: defaultRequest,
  setCurrentRequest: () => {},
});

const CurrentRequestProvider: FunctionComponent = ({ children }) => {
  const [currentRequest, setCurrentRequest] = useState<Request>(defaultRequest);

  return (
    <CurrentRequestContext.Provider
      value={{
        currentRequest,
        setCurrentRequest,
      }}
    >
      {children}
    </CurrentRequestContext.Provider>
  );
};

export { CurrentRequestContext };

export default CurrentRequestProvider;
