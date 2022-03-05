import { ChakraProvider } from '@chakra-ui/react';
import { createContext, useState } from 'react';

import User from './model/User';
import Dashboard from './pages/dashboard/Dashboard';
import Login from './pages/login';
import theme from './theme';

const UserContext = createContext([{} as User, null as any]);

function App() {
  const [user, setUser] = useState<User | null>({ username: 'hello', isAdmin: true });

  return (
    <ChakraProvider theme={theme}>
      <UserContext.Provider value={[user, setUser]}>
        {user ? <Dashboard /> : <Login />}
      </UserContext.Provider>
    </ChakraProvider>
  );
}

export default App;
