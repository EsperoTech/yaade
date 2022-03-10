import {
  Box,
  Button,
  Center,
  Checkbox,
  Heading,
  Input,
  Text,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { useContext } from 'react';
import { useState } from 'react';

import { UserContext } from '../../App';
import User from '../../model/User';
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

  async function handleLoginClick() {
    try {
      setState({ ...state, loading: true });

      // const response = await fetch('/login', {
      //   method: 'POST',
      //   body: JSON.stringify(state),
      // });
      // if (response.status !== 200) throw new Error();

      // const user = (await response.json()) as User;

      setUser({ username: 'joro', isAdmin: 'true', settings: {} });
      setState({ ...state, loading: false });
      toast({
        title: `Hello ${state.username}.`,
        description: `You were successfully logged in.`,
        status: 'success',
        isClosable: true,
      });
    } catch (e) {
      console.log(e);
      setState({ ...state, loading: false });

      toast({
        title: 'Could not login.',
        description: 'An error occured during login. Please try again.',
        status: 'error',
        isClosable: true,
      });
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
