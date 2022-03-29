import {
  Box,
  Button,
  Center,
  Heading,
  Input,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { FormEvent, useContext } from 'react';
import { useEffect, useState } from 'react';

import { UserContext } from '../../context';
import User from '../../model/User';
import { errorToast, successToast } from '../../utils';
import styles from './Login.module.css';

type State = {
  username: string;
  password: string;
  loading: boolean;
};

function Login() {
  const toast = useToast();
  const { colorMode } = useColorMode();
  const { setUser } = useContext(UserContext);
  const [state, setState] = useState<State>({
    username: '',
    password: '',
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

  async function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
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

      const usr = await response.json();

      setUser(usr);
      setState({ ...state, loading: false });
      successToast('You are successfully logged in.', toast);
    } catch (e) {
      setState({ ...state, loading: false });
      errorToast('Login was not successful.', toast);
    }
  }

  return (
    <div className={styles.root}>
      <Box className={styles.container} bg="panelBg">
        <div className={styles.heading}>
          <img className={styles.img} src="yaade-icon.png" alt="yaade icon" />
          <Heading as="h1" size="lg">
            Yaade
          </Heading>
        </div>
        <form onSubmit={handleFormSubmit}>
          <Input
            mt="4"
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
            mt="4"
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
            <Button
              mt="6"
              colorScheme="green"
              borderRadius={20}
              w={200}
              isLoading={state.loading}
              type="submit"
            >
              LOGIN
            </Button>
          </Center>
        </form>
      </Box>
    </div>
  );
}

export default Login;
