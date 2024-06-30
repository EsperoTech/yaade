import { QuestionIcon } from '@chakra-ui/icons';
import {
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Switch,
  Tooltip,
} from '@chakra-ui/react';

import { CollectionSettings } from '../../../model/Collection';
import GroupsInput from '../../groupsInput';
import styles from './CollectionSettingsTab.module.css';

type CollectionSettingsTabProps = {
  groups: string[];
  setGroups: (groups: string[]) => void;
  settings?: CollectionSettings;
  setSettings(settings: CollectionSettings): void;
};

export default function CollectionSettingsTab({
  groups,
  setGroups,
  settings,
  setSettings,
}: CollectionSettingsTabProps) {
  function handleWebClientOptionsChanged(key: string, value: any) {
    setSettings({
      ...settings,
      webClientOptions: {
        ...settings?.webClientOptions,
        [key]: value,
      },
    });
  }
  function handleExtensionOptionsChanged(key: string, value: any) {
    setSettings({
      ...settings,
      extensionOptions: {
        ...settings?.extensionOptions,
        [key]: value,
      },
    });
  }

  function handleExtensionTimeoutChange(value: string) {
    if (!value || isNaN(Number(value))) {
      return;
    }
    handleExtensionOptionsChanged('timeout', Number(value));
  }

  return (
    <div className={styles.grid}>
      <div>Groups</div>
      <GroupsInput groups={groups} setGroups={setGroups} isRounded />
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <p>Extension Options</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <NumberInput
            value={settings?.extensionOptions?.timeout || 5}
            onChange={(value) => handleExtensionTimeoutChange(value)}
            placeholder="Timeout (seconds)"
            size="sm"
            min={1}
            width="75px"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <p>Timeout (Seconds)</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <p>Server Proxy Options</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Switch
          colorScheme="green"
          size="md"
          onChange={(e) => handleWebClientOptionsChanged('verifyHost', e.target.checked)}
          isChecked={
            settings?.webClientOptions?.verifyHost === undefined
              ? true
              : settings.webClientOptions.verifyHost
          }
        >
          Verify Host
        </Switch>
        <Switch
          colorScheme="green"
          size="md"
          onChange={(e) => handleWebClientOptionsChanged('trustAll', e.target.checked)}
          isChecked={!!settings?.webClientOptions?.trustAll}
        >
          Trust All
        </Switch>
      </div>
    </div>
  );
}
