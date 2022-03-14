import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import {
  Button,
  Divider,
  Heading,
  IconButton,
  ModalCloseButton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { useState } from 'react';

import { cn } from '../../utils';
import styles from './Settings.module.css';

type SettingsTabProps = {
  name: string;
  children: any;
};

function SettingsTab({ name, children }: SettingsTabProps) {
  return (
    <div className={styles.settingsTabContainer}>
      <div style={{ display: 'flex' }}>
        <Heading mb="4">{name}</Heading>
        <ModalCloseButton ml="auto" size="md" />
      </div>
      <Divider mb="4" />
      {children}
    </div>
  );
}

type SettingsState = {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
};

function Settings() {
  const [state, setState] = useState<SettingsState>({
    currentPassword: '',
    newPassword: '',
    repeatPassword: '',
  });
  const { colorMode, setColorMode } = useColorMode();

  const sx = {
    borderRadius: '0 20px 20px 0',
    borderWidth: '0px',
    justifyContent: 'start',
    paddingLeft: '2rem',
    boxSizing: 'border-box',
  };
  const selected = {
    bg: colorMode === 'light' ? 'gray.200' : 'gray.800',
    borderLeft: '4px solid var(--chakra-colors-green-500)',
    boxSizing: 'border-box',
  };

  return (
    <div className={styles.container}>
      <Tabs colorScheme="green" orientation="vertical" size="lg" tabIndex={-1}>
        <div className={styles.tabListWrapper}>
          <TabList className={styles.tabs} sx={{ borderLeft: '0px' }} tabIndex={-1}>
            <Tab sx={sx} _selected={selected} tabIndex={-1}>
              General
            </Tab>
            <Tab sx={sx} _selected={selected}>
              Account
            </Tab>
            <Tab sx={sx} _selected={selected}>
              About
            </Tab>
          </TabList>
        </div>

        <TabPanels tabIndex={-1}>
          <TabPanel tabIndex={-1}>
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
              <Heading as="h4" size="md" mb="2" mt="4">
                Export Backup
              </Heading>
              <Text>
                Export your entire Yaade data into a single file that can be used to
                restore your data.
              </Text>
              <Button mt="6" borderRadius={20} colorScheme="green" w={150}>
                Export
              </Button>
              <Heading as="h4" size="md" mb="2" mt="4">
                Import Backup
              </Heading>
              <Text>
                Import a backup file. Make sure to backup your data before importing or
                else data could be lost.
              </Text>
              <input className={cn(styles, 'fileInput', [colorMode])} type="file" />
              <Button mt="8" borderRadius={20} colorScheme="green" w={150}>
                Import
              </Button>
            </SettingsTab>
          </TabPanel>
          <TabPanel>
            <SettingsTab name="Account">
              <Heading as="h4" size="md" mb="4">
                User
              </Heading>
              <Stack direction="row" alignItems="center" mb="4">
                <p>Logged in as</p>
                <span style={{ fontWeight: 700 }}>joro</span>
                <Button colorScheme="red" variant="outline" size="sm" borderRadius={20}>
                  Logout
                </Button>
              </Stack>
              <Heading as="h4" size="md" mb="4">
                Password
              </Heading>
              <form>
                <input
                  className={cn(styles, 'input', [colorMode])}
                  id="current-password-input"
                  type="password"
                  placeholder="Current Password..."
                  value={state.currentPassword}
                  onChange={(e) =>
                    setState({ ...state, currentPassword: e.target.value })
                  }
                />
                <input
                  className={cn(styles, 'input', [colorMode])}
                  id="new-password-input"
                  type="password"
                  placeholder="New Password..."
                />
                <input
                  className={cn(styles, 'input', [colorMode])}
                  id="repeat-password-input"
                  type="password"
                  placeholder="New Password..."
                />
                <Button mt="4" borderRadius={20} colorScheme="green">
                  Change password
                </Button>
              </form>
            </SettingsTab>
          </TabPanel>
          <TabPanel>
            <SettingsTab name="About">
              From Munich with ❤️
              <br />
              <br />
              Created by Jonathan Rösner at EsperoTech.
            </SettingsTab>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default Settings;
