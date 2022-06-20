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
  isAdmin: () => boolean;
}

const UserContext = createContext<IUserContext>({
  user: undefined,
  setUser: () => {},
  isAdmin: () => false,
});

const UserProvider: FunctionComponent = ({ children }) => {
  const [user, setUser] = useState<User>();

  const isAdmin = () => {
    const groups = (user?.data?.groups ?? []) as Array<string>;
    return groups.includes('admin');
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        isAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };

export default UserProvider;
