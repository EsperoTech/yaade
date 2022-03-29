import { ChakraProvider } from '@chakra-ui/react';
import { createContext, useContext, useState } from 'react';

import ContextProvider, { UserContext } from './context';
import CollectionsProvider from './context';
import User from './model/User';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import theme from './theme';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <ContextProvider>
        <AppWithUser />
      </ContextProvider>
    </ChakraProvider>
  );
}

function AppWithUser() {
  const { user } = useContext(UserContext);

  return user ? <Dashboard /> : <Login />;
}

export default App;
