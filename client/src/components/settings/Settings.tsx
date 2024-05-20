import {
  Divider,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
} from '@chakra-ui/react';
import { useContext } from 'react';

import { UserContext } from '../../context';
import AccountSettings from './accountSettings';
import AdminSettings from './adminSettings';
import CertificateSettings from './certificateSettings';
import GeneralSettings from './generalSettings';
import styles from './Settings.module.css';
import SettingsTab from './settingsTab';
import UserSettings from './userSettings';

const sx = {
  borderRadius: '0 20px 20px 0',
  borderWidth: '0px',
  justifyContent: 'start',
  paddingLeft: '2rem',
  boxSizing: 'border-box',
};

function Settings() {
  const { isAdmin } = useContext(UserContext);
  const { colorMode } = useColorMode();

  const selected = {
    bg: colorMode === 'light' ? 'gray.200' : 'gray.800',
    borderLeft: '4px solid var(--chakra-colors-green-500)',
    boxSizing: 'border-box',
  };

  return (
    <div className={styles.container}>
      <Tabs isLazy colorScheme="green" orientation="vertical" size="lg" tabIndex={-1}>
        <div className={styles.tabListWrapper}>
          <TabList className={styles.tabs} sx={{ borderLeft: '0px' }} tabIndex={-1}>
            <Tab sx={sx} _selected={selected} tabIndex={-1}>
              General
            </Tab>
            <Tab sx={sx} _selected={selected}>
              Account
            </Tab>
            {isAdmin() ? (
              <>
                <Divider my="4" />
                <Tab sx={sx} _selected={selected}>
                  Backup
                </Tab>
                <Tab sx={sx} _selected={selected}>
                  Users
                </Tab>
                <Divider my="4" />
              </>
            ) : null}
            <Tab sx={sx} _selected={selected}>
              Certificates
            </Tab>
            <Tab sx={sx} _selected={selected}>
              About
            </Tab>
          </TabList>
        </div>

        <TabPanels tabIndex={-1}>
          <TabPanel tabIndex={-1}>
            <GeneralSettings />
          </TabPanel>
          <TabPanel>
            <AccountSettings />
          </TabPanel>
          {isAdmin() ? (
            <TabPanel>
              <AdminSettings />
            </TabPanel>
          ) : null}
          {isAdmin() ? (
            <TabPanel>
              <UserSettings />
            </TabPanel>
          ) : null}
          <TabPanel>
            <CertificateSettings />
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
