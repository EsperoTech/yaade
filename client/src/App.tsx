import { ChakraProvider } from '@chakra-ui/react';
import { createContext, useState } from 'react';

import CollectionProvider from './context/collectionsContext';
import Collection from './model/Collection';
import User from './model/User';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import theme from './theme';

interface IUserContext {
  user: User | undefined;
  setUser: Function;
}

const UserContext = createContext<IUserContext>({
  user: undefined,
  setUser: () => {},
});

function App() {
  const [user, setUser] = useState<User | undefined>();

  return (
    <ChakraProvider theme={theme}>
      <UserContext.Provider value={{ user, setUser }}>
        <CollectionProvider>{user ? <Dashboard /> : <Login />}</CollectionProvider>
      </UserContext.Provider>
    </ChakraProvider>
  );
}

export { UserContext };

export default App;
