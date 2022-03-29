import { FunctionComponent } from 'react';

import CollectionsProvider, { CollectionsContext } from './CollectionsContext';
import CurrentRequestProvider, { CurrentRequestContext } from './CurrentRequestContext';
import UserProvider, { UserContext } from './UserContext';

const ContextProvider: FunctionComponent = ({ children }) => {
  return (
    <CollectionsProvider>
      <CurrentRequestProvider>
        <UserProvider>{children}</UserProvider>
      </CurrentRequestProvider>
    </CollectionsProvider>
  );
};

export { CollectionsContext, CurrentRequestContext, UserContext };

export default ContextProvider;
