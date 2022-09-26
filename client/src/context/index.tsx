import { FunctionComponent } from 'react';

import UserProvider, { UserContext } from './UserContext';

const ContextProvider: FunctionComponent = ({ children }) => {
  return <UserProvider>{children}</UserProvider>;
};

export { UserContext };

export default ContextProvider;
