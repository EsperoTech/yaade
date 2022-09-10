import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FunctionComponent, useEffect, useState } from 'react';

import User from '../../../model/User';
import { errorToast } from '../../../utils';
import SettingsTab from '../settingsTab';
import ExternalProviderTab from './providerTabs/ExternalProviderTab';
import LocalProviderTab from './providerTabs/LocalProviderTab';

interface Provider {
  id: string;
  provider: string;
  params: any;
  fields: any;
}

interface AuthConfig {
  providers: Provider[];
}

type UserSettingsState = {
  users: User[];
};

const UserSettings: FunctionComponent = () => {
  const [state, setState] = useState<UserSettingsState>({
    users: [],
  });

  const toast = useToast();

  useEffect(() => {
    const getUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const users = await res.json();
        setState((s) => {
          return { ...s, users };
        });
      } catch (e) {
        errorToast('Users could not be fetched.', toast);
      }
    };
    getUsers();
  }, []);

  function setUsers(users: User[]) {
    setState((s) => {
      return { ...s, users };
    });
  }

  function setAuthConfig(authConfig: AuthConfig) {
    setState((s) => {
      return { ...s, authConfig };
    });
  }

  function getLocalUsers() {
    // NOTE: this regex matches any <provider>$<username>, negate it to get all local users
    const re = /^.*\$.*$/;
    return state.users.filter((user) => !user.username.match(re));
  }

  return (
    <SettingsTab name="Users">
      <Tabs
        colorScheme="green"
        mt="1"
        display="flex"
        flexDirection="column"
        maxHeight="100%"
        h="100%"
        mb="4"
      >
        <TabList>
          <Tab>Local</Tab>
          <Tab>External</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel>
            <LocalProviderTab users={getLocalUsers()} setUsers={setUsers} />
          </TabPanel>
          <TabPanel h="100%">
            <ExternalProviderTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </SettingsTab>
  );
};

export type { AuthConfig, Provider };

export default UserSettings;
