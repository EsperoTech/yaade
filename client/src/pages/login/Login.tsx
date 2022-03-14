import {
  Box,
  Button,
  Center,
  Checkbox,
  Heading,
  Input,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { useContext } from 'react';
import { useEffect, useState } from 'react';

import { UserContext } from '../../App';
import User from '../../model/User';
import { errorToast, successToast } from '../../utils';
import styles from './Login.module.css';

type State = {
  username: string;
  password: string;
  remember: boolean;
  loading: boolean;
};

function Login() {
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { setUser } = useContext(UserContext);
  const [state, setState] = useState<State>({
    username: '',
    password: '',
    remember: true,
    loading: false,
  });

  useEffect(() => {
    async function tryAutoLogin() {
      try {
        setState((state) => ({ ...state, loading: true }));

        const response = await fetch('/api/user');
        if (response.status !== 200) throw new Error();

        const user = (await response.json()) as User;

        setUser({ username: user.username, settings: {} });
        setState((state) => ({ ...state, loading: false }));
      } catch (e) {
        console.log(e);
        setState((state) => ({ ...state, loading: false }));
      }
    }
    tryAutoLogin();
  }, []);

  async function handleLoginClick() {
    try {
      setState({ ...state, loading: true });

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: state.username,
          password: state.password,
        }),
      });
      if (response.status !== 200) throw new Error();

      setUser({ username: 'joro', settings: {} });
      setState({ ...state, loading: false });
      successToast('You are successfully logged in.', toast);
    } catch (e) {
      console.log(e);
      setState({ ...state, loading: false });

      errorToast('Login was not successful.', toast);
    }
  }

  return (
    <div className={styles.root}>
      <Box className={styles.container} bg="panelBg">
        <div className={styles.heading}>
          <Heading as="h1" size="lg" mt="4">
            Yaade
          </Heading>
        </div>
        <Input
          mt="6"
          placeholder="Username"
          w="100%"
          borderRadius={20}
          size="lg"
          colorScheme="green"
          backgroundColor={colorMode === 'light' ? 'white' : undefined}
          value={state.username}
          onChange={(e) => setState({ ...state, username: e.target.value })}
        />
        <Input
          mt="6"
          placeholder="Password"
          type="password"
          w="100%"
          borderRadius={20}
          size="lg"
          colorScheme="green"
          backgroundColor={colorMode === 'light' ? 'white' : undefined}
          value={state.password}
          onChange={(e) => setState({ ...state, password: e.target.value })}
        />
        <Center>
          <Checkbox
            size="lg"
            mt="6"
            colorScheme="green"
            defaultChecked
            onChange={(e) => setState({ ...state, remember: e.target.checked })}
          >
            Remember me
          </Checkbox>
        </Center>
        <Center>
          <Button
            mt="6"
            colorScheme="green"
            borderRadius={20}
            w={200}
            onClick={handleLoginClick}
            isLoading={state.loading}
          >
            LOGIN
          </Button>
        </Center>
      </Box>
    </div>
  );
}

export default Login;
