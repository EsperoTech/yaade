import { ChakraProvider, ToastId, useInterval, useToast } from '@chakra-ui/react';
import { useContext, useRef, useState } from 'react';

import ContextProvider, { UserContext } from './context';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import theme from './theme';

const autoLogoutDurationInS = 30;

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
  const { user, setUser } = useContext(UserContext);
  const [logoutCounter, setLogoutCounter] = useState<number>(autoLogoutDurationInS);
  const toast = useToast();
  const toastIdRef = useRef<ToastId>();

  function update(counter: number) {
    if (toastIdRef.current) {
      toast.update(toastIdRef.current, {
        description: `No connection to server. Logout in ${counter}`,
        duration: null,
        position: 'top',
      });
    }
  }

  function showConnectionWarning() {
    toastIdRef.current = toast({
      description: `No connection to server. Logout in ${logoutCounter}`,
      duration: null,
      position: 'top',
    });
  }

  function showConnectionRestored() {
    toast({
      description: `Connection to server restored`,
      status: 'success',
      isClosable: false,
      duration: 3000,
      position: 'top',
    });
  }

  function closeAll() {
    toast.closeAll();
    toastIdRef.current = undefined;
  }

  useInterval(async () => {
    if (user) {
      try {
        const res = await fetch(import.meta.env.BASE_URL + 'api/user');
        if (res.status === 200) {
          if (toastIdRef.current) {
            closeAll();
            showConnectionRestored();
            setLogoutCounter(autoLogoutDurationInS);
          }
        } else {
          throw new Error('No connection to server...');
        }
      } catch (e) {
        if (toastIdRef.current) {
          if (logoutCounter === 0) {
            setUser(undefined);
            setLogoutCounter(autoLogoutDurationInS);
            closeAll();
          } else {
            const newCounter = logoutCounter - 1;
            setLogoutCounter(newCounter);
            update(newCounter);
          }
        } else {
          showConnectionWarning();
        }
      }
    } else {
      setLogoutCounter(autoLogoutDurationInS);
      closeAll();
    }
  }, 1000);

  return user ? <Dashboard /> : <Login />;
}

export default App;
