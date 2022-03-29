import {
  createContext,
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useState,
} from 'react';

import User from '../model/User';

interface IUserContext {
  user: User | undefined;
  setUser: Dispatch<SetStateAction<User | undefined>>;
}

const UserContext = createContext<IUserContext>({
  user: undefined,
  setUser: () => {},
});

const UserProvider: FunctionComponent = ({ children }) => {
  const [user, setUser] = useState<User>();

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };

export default UserProvider;
