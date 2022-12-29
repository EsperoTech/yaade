import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Heading,
  HStack,
  IconButton,
  Stack,
  Switch,
  Text,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { FunctionComponent, useContext } from 'react';

import { UserContext } from '../../../context';
import { errorToast, successToast } from '../../../utils';
import SettingsTab from '../settingsTab';

type GeneralSettingsProps = {};

const GeneralSettings: FunctionComponent<GeneralSettingsProps> = () => {
  const { colorMode, setColorMode } = useColorMode();
  const { user, setUser } = useContext(UserContext);
  const toast = useToast();

  async function handleSettingChanged(key: string, value: number | boolean | string) {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'api/user/changeSetting', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
        }),
      });
      if (response.status !== 200) throw new Error();
      setUser({
        ...user!,
        data: {
          ...user?.data,
          settings: {
            ...user?.data.settings,
            [key]: value,
          },
        },
      });
      successToast('Settings saved.', toast);
    } catch (e) {
      errorToast('Setting could not be changed.', toast);
    }
  }

  return (
    <SettingsTab name="General">
      <Heading as="h4" size="md" mb="2">
        Theme ({colorMode})
      </Heading>
      <Stack direction="row" alignItems="center">
        <IconButton
          aria-label="add-collection-button"
          icon={<SunIcon />}
          onClick={() => setColorMode('light')}
          variant="ghost"
          color={colorMode === 'light' ? 'green' : 'gray'}
        />
        <IconButton
          aria-label="add-collection-button"
          icon={<MoonIcon />}
          onClick={() => setColorMode('dark')}
          variant="ghost"
          colorScheme={colorMode === 'dark' ? 'green' : 'gray'}
        />
      </Stack>
      <Heading as="h4" size="md" mb="4" mt="4">
        Behavior
      </Heading>
      <HStack mb="2">
        <Text w="200px">Save after successful send</Text>
        <Switch
          colorScheme="green"
          size="md"
          onChange={(e) => handleSettingChanged('saveOnSend', e.target.checked)}
          isChecked={user?.data?.settings?.saveOnSend}
        >
          {user?.data?.settings?.saveOnSend ? 'ON' : 'OFF'}
        </Switch>
      </HStack>
      <HStack>
        <Text w="200px">Save on close</Text>
        <Switch
          colorScheme="green"
          size="md"
          onChange={(e) => handleSettingChanged('saveOnClose', e.target.checked)}
          isChecked={user?.data?.settings?.saveOnClose}
        >
          {user?.data?.settings?.saveOnClose ? 'ON' : 'OFF'}
        </Switch>
      </HStack>
    </SettingsTab>
  );
};
export default GeneralSettings;
