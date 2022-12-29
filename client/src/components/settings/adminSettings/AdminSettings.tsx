import {
  Button,
  Checkbox,
  Heading,
  Text,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { FunctionComponent, useContext, useState } from 'react';

import { UserContext } from '../../../context';
import { BASE_PATH, cn, errorToast } from '../../../utils';
import SettingsTab from '../settingsTab';
import styles from './AdminSettings.module.css';

type AdminSettingsProps = {};

type AdminSettingsState = {
  acknowledge: boolean;
  backupfile?: any;
};

const AdminSettings: FunctionComponent<AdminSettingsProps> = () => {
  const [state, setState] = useState<AdminSettingsState>({
    acknowledge: false,
  });
  const { colorMode } = useColorMode();
  const { setUser } = useContext(UserContext);
  const toast = useToast();

  async function handleImportBackupClick() {
    try {
      const data = new FormData();
      data.append('File', state.backupfile, 'yaade-db.mv.db');

      const response = await fetch(BASE_PATH + 'api/user/importBackup', {
        method: 'POST',
        body: data,
      });

      if (response.status !== 200) throw new Error();

      setUser(undefined);
    } catch (e) {
      errorToast('Failed to import backup', toast);
    }
  }

  async function handleExportBackupClick() {
    try {
      const response = await fetch(BASE_PATH + 'api/user/exportBackup');
      if (response.status !== 200) throw new Error();
      const blob = await response.blob();

      let url = window.URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.href = url;
      a.download = 'yaade-db.mv.db';
      a.click();
    } catch (e) {
      errorToast('Data could not be exported.', toast);
    }
  }

  return (
    <SettingsTab name="Admin">
      <Heading as="h4" size="md" mb="2" mt="2">
        Export Backup
      </Heading>
      <Text>
        Export your entire Yaade data into a single file that can be used to restore your
        data.
      </Text>
      <Button
        mt="4"
        borderRadius={20}
        colorScheme="green"
        w={150}
        onClick={handleExportBackupClick}
      >
        Export
      </Button>
      <Heading as="h4" size="md" mb="2" mt="4">
        Import Backup
      </Heading>
      <Text>
        Import a backup file. Make sure to backup your data before importing or else data
        could be lost.
      </Text>
      <input
        className={cn(styles, 'fileInput', [colorMode])}
        type="file"
        accept=".db"
        onChange={(e) => {
          const backupfile = e.target.files ? e.target.files[0] : undefined;
          setState({ ...state, backupfile });
        }}
      />
      <Checkbox
        mt="4"
        colorScheme="green"
        onChange={(e) => setState({ ...state, acknowledge: e.target.checked })}
      >
        <Text fontSize={12}>
          I acknowledge that importing a backup file will result in a complete loss of my
          current data with no way of recovery.
        </Text>
      </Checkbox>
      <Button
        mt="4"
        borderRadius={20}
        colorScheme="green"
        disabled={!state.backupfile || !state.acknowledge}
        w={150}
        onClick={handleImportBackupClick}
      >
        Import
      </Button>
    </SettingsTab>
  );
};
export default AdminSettings;
