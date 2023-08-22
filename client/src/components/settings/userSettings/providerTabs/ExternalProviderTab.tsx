import { AddIcon, CheckIcon, CloseIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Center,
  Divider,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  useColorMode,
  useToast,
  VStack,
} from '@chakra-ui/react';
import CodeMirror from '@uiw/react-codemirror';
import beautify from 'beautify';
import {
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { UserContext } from '../../../../context';
import { BASE_PATH, errorToast, successToast } from '../../../../utils';
import { json } from '../../../../utils/codemirror/lang-json';

interface Provider {
  id: string;
  provider: string;
  params: any;
  fields: any;
}

interface AuthConfig {
  providers: Provider[];
}

const ExternalProviderTab: FunctionComponent = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const cmValue = useRef<string>('');
  const [originalConfig, setOriginalConfig] = useState<AuthConfig>({
    providers: [],
  });
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const getProviders = async () => {
      try {
        const res = await fetch(BASE_PATH + 'api/config/auth_config');
        const authConfig = await res.json();
        setOriginalConfig(authConfig);
        cmValue.current = beautifiedConfig(authConfig);
      } catch (e) {
        errorToast('Auth providers could not be fetched.', toast);
      }
    };
    getProviders();
  }, []);

  const onChangeCodeMirror = useCallback((value) => {
    cmValue.current = value;
  }, []);

  function beautifiedConfig(config: AuthConfig) {
    return beautify(JSON.stringify(config), { format: 'json' });
  }

  async function handleSaveAuthConfigClicked() {
    try {
      const res = await fetch(BASE_PATH + 'api/config/auth_config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: cmValue.current,
      });
      if (res.status !== 200) {
        const error = await res.json();
        throw Error(error.message ?? 'An unknown error occured');
      }
      successToast('Saved auth config. Server will now restart!', toast);
      // NOTE: timeout here to prevent logout before server is back up
      setTimeout(() => {
        setUser(undefined);
      }, 3000);
    } catch (e) {
      errorToast(`${e}`, toast, 4000);
    }
  }

  return (
    <VStack alignItems="flex-start" w="100%">
      {/* <CodeMirror
        value={cmValue.current}
        onChange={onChangeCodeMirror}
        extensions={[json()]}
        theme={colorMode}
        style={{ height: '350px', width: '100%' }}
      /> */}
      <HStack>
        <Button onClick={handleSaveAuthConfigClicked}>Save</Button>
      </HStack>
    </VStack>
  );
};

export default ExternalProviderTab;
