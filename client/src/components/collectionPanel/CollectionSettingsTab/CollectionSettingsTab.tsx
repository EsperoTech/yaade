import { QuestionIcon } from '@chakra-ui/icons';
import { Switch, Tooltip } from '@chakra-ui/react';

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

  return (
    <div className={styles.grid}>
      <div>Groups</div>
      <GroupsInput groups={groups} setGroups={setGroups} isRounded />
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <p>Web Client Options</p>
        <Tooltip label="Only applies for the server proxy" fontSize="md">
          <QuestionIcon />
        </Tooltip>
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
