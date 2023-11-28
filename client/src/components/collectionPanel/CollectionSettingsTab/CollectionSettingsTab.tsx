import { CheckIcon } from '@chakra-ui/icons';
import { IconButton } from '@chakra-ui/react';
import { useState } from 'react';

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

  const handleSaveGroupsClicked = () => {
    console.log(state.rawGroups);
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
        icon={<CheckIcon />}
        variant="ghost"
        colorScheme="green"
        aria-label="Save description"
        onClick={handleSaveGroupsClicked}
      />
    </div>
  );
}
