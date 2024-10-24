import { FunctionComponent } from 'react';

import CurrentModalProvider from './CurrentModalContext';
import FocusElementsProvider from './FocusElementsContext';
import UserProvider, { UserContext } from './UserContext';

const ContextProvider: FunctionComponent = ({ children }) => {
  return (
    <UserProvider>
      <CurrentModalProvider>
        <FocusElementsProvider>{children}</FocusElementsProvider>
      </CurrentModalProvider>
    </UserProvider>
  );
};

export { UserContext };

export default ContextProvider;
