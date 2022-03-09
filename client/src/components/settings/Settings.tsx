import {
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
} from '@chakra-ui/react';

import styles from './Settings.module.css';

type SettingsProps = {
  settings: any;
  setSettings: any;
};

type SettingsTabProps = {
  name: string;
  children: any;
};

function SettingsTab({ name, children }: SettingsTabProps) {
  return (
    <div className={styles.settingsTabContainer}>
      <Heading mb="3">{name}</Heading>
      {children}
    </div>
  );
}

const sx = {
  borderRadius: '0 20px 20px 0',
  borderWidth: '0px',
};
const selected = {
  bg: 'gray.800',
  borderLeft: '4px solid var(--chakra-colors-green-500)',
};

function Settings({ settings, setSettings }: SettingsProps) {
  const { colorMode, toggleColorMode } = useColorMode();
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
              <button onClick={toggleColorMode}>
                {colorMode === 'light' ? 'dark' : 'light'}
              </button>
            </SettingsTab>
          </TabPanel>
          <TabPanel>
            <SettingsTab name="Appearance">Hello</SettingsTab>
          </TabPanel>
          <TabPanel>
            <SettingsTab name="About">Hello</SettingsTab>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default Settings;
