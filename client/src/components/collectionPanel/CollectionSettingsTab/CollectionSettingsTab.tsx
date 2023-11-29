import { IconButton } from '@chakra-ui/react';
import { useState } from 'react';
import { VscSave } from 'react-icons/vsc';

import GroupsInput from '../../groupsInput';

type CollectionSettingsTabProps = {
  groups: string[];
  setGroups: (groups: string[]) => void;
};

type SettingsTabState = {
  rawGroups: string[];
};

export default function CollectionSettingsTab({
  groups,
  setGroups,
}: CollectionSettingsTabProps) {
  const [state, setState] = useState<SettingsTabState>({
    rawGroups: [...groups],
  });

  const handleSaveCollectionSettingsClicked = () => {
    setGroups(state.rawGroups);
  };

  return (
    <div>
      <GroupsInput
        groups={state.rawGroups}
        setGroups={(rawGroups: string[]) => setState({ ...state, rawGroups })}
        isRounded
      />
      <IconButton
        icon={<VscSave />}
        variant="ghost"
        colorScheme="green"
        aria-label="Save settings"
        onClick={handleSaveCollectionSettingsClicked}
      />
    </div>
  );
}
