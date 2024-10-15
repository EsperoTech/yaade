import { Button, HStack, useColorMode, useToast, VStack } from '@chakra-ui/react';
import CodeMirror from '@uiw/react-codemirror';
import beautify from 'beautify';
import { FunctionComponent, useCallback, useContext, useEffect, useState } from 'react';

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
  const [config, setConfig] = useState<string>('');
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    const getProviders = async () => {
      try {
        const res = await fetch(BASE_PATH + 'api/config/auth_config');
        const authConfig = await res.json();
        setConfig(beautifiedConfig(authConfig));
      } catch (e) {
        errorToast('Auth providers could not be fetched.', toast);
      }
    };
    getProviders();
  }, [toast]);

  const onChangeCodeMirror = useCallback((value) => {
    setConfig(value);
  }, []);

  function beautifiedConfig(config: AuthConfig): string {
    return beautify(JSON.stringify(config), { format: 'json' });
  }

  async function handleSaveAuthConfigClicked() {
    try {
      const res = await fetch(BASE_PATH + 'api/config/auth_config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: config,
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
    <>
      <div
        style={{
          height: '400px',
          maxHeight: '400px',
          minHeight: '400px',
          overflow: 'auto',
          marginBottom: '1rem',
        }}
      >
        <CodeMirror
          value={config}
          onChange={onChangeCodeMirror}
          extensions={[json()]}
          theme={colorMode}
        />
      </div>
      <Button onClick={handleSaveAuthConfigClicked}>Save</Button>
    </>
  );
};

export default ExternalProviderTab;
