import { Divider, Heading, ModalCloseButton } from '@chakra-ui/react';
import { FunctionComponent } from 'react';

import styles from './SettingsTab.module.css';

type SettingsTabProps = {
  name: string;
  children: any;
};

const SettingsTab: FunctionComponent<SettingsTabProps> = ({ name, children }) => {
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
};
export default SettingsTab;
