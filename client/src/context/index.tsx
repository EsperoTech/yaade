import { FunctionComponent } from 'react';

import CurrentRequestProvider from './CurrentRequestContext';
import UserProvider, { UserContext } from './UserContext';

const ContextProvider: FunctionComponent = ({ children }) => {
  return (
    <UserProvider>
      <CurrentRequestProvider>{children}</CurrentRequestProvider>
    </UserProvider>
  );
};

export { UserContext };

export default ContextProvider;
