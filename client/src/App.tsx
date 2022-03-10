import { ChakraProvider } from '@chakra-ui/react';
import { createContext, useState } from 'react';

import User from './model/User';
import Dashboard from './pages/dashboard/Dashboard';
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
        {user ? <Dashboard /> : <Login />}
      </UserContext.Provider>
    </ChakraProvider>
  );
}

export { UserContext };

export default App;
