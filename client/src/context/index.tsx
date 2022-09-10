import { FunctionComponent } from 'react';

import CollectionsProvider from './CollectionsContext';
import CurrentRequestProvider from './CurrentRequestContext';
import UserProvider, { UserContext } from './UserContext';

const ContextProvider: FunctionComponent = ({ children }) => {
  return (
    <UserProvider>
      <CollectionsProvider>
        <CurrentRequestProvider>{children}</CurrentRequestProvider>
      </CollectionsProvider>
    </UserProvider>
  );
};

export { UserContext };

export default ContextProvider;
