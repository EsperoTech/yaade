import { QuestionOutlineIcon } from '@chakra-ui/icons';
import { IconButton, Input, Select, Text, Tooltip, useColorMode } from '@chakra-ui/react';
import { Dispatch, useCallback } from 'react';
import { VscDebugPause, VscPlay } from 'react-icons/vsc';

import { CurrentScript } from '../../model/Script';
import { CurrentScriptAction, CurrentScriptActionType } from '../../state/currentScript';
import { validateCronExpression } from '../../utils';

type SettingsTabProps = {
  currentScript: CurrentScript;
  envNames: string[];
  dispatchCurrentScript: Dispatch<CurrentScriptAction>;
  saveScript: (script: CurrentScript) => void;
};

function SettingsTab({
  currentScript,
  envNames,
  dispatchCurrentScript,
  saveScript,
}: SettingsTabProps) {
  const { colorMode } = useColorMode();

  const setCronExpression = useCallback(
    (cronExpression: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { cronExpression },
      });
    },
    [dispatchCurrentScript],
  );

  const setSelectedEnvName = useCallback(
    (selectedEnvName: string) => {
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { selectedEnvName },
      });
    },
    [dispatchCurrentScript],
  );

  const setEnabled = useCallback(
    (enabled: boolean) => {
      saveScript({
        ...currentScript,
        data: {
          ...currentScript.data,
          enabled,
          lastRun: enabled ? Date.now() : undefined,
        },
      });
      dispatchCurrentScript({
        type: CurrentScriptActionType.PATCH_DATA,
        data: { enabled },
      });
    },
    [currentScript, dispatchCurrentScript, saveScript],
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <Text fontSize="sm" fontWeight="bold" color="gray.500" mr="2">
            Cron Configuration
          </Text>
          <Tooltip
            label="Configure the script as a cron job to run periodically on the server. Visit the docs for more information."
            fontSize="md"
          >
            <QuestionOutlineIcon color="gray.500" />
          </Tooltip>
        </div>
        <div style={{ display: 'flex' }}>
          <Input
            placeholder="* * * * *"
            w="120px"
            mr="2"
            size="sm"
            colorScheme="green"
            backgroundColor={colorMode === 'light' ? 'white' : undefined}
            value={currentScript.data.cronExpression ?? ''}
            isInvalid={!validateCronExpression(currentScript.data.cronExpression ?? '')}
            onChange={(e) => setCronExpression(e.target.value)}
          />
          <Select
            size="sm"
            w="150px"
            onChange={(e) => setSelectedEnvName(e.target.value)}
            disabled={envNames.length === 0}
            value={currentScript.data.selectedEnvName ?? 'No Env Selected'}
          >
            <option key="NO_ENV" value="NO_ENV">
              NO_ENV
            </option>
            {envNames.length > 0 ? (
              envNames
                .filter((e) => e !== '')
                .map((envName) => (
                  <option key={envName} value={envName}>
                    {envName}
                  </option>
                ))
            ) : (
              <option value="">No Envs</option>
            )}
          </Select>
          <IconButton
            aria-label="pause-button"
            icon={<VscDebugPause />}
            variant="ghost"
            colorScheme="red"
            size="sm"
            ml="2"
            disabled={!currentScript.data.enabled}
            onClick={() => setEnabled(false)}
          />
          <IconButton
            aria-label="save-button"
            icon={<VscPlay />}
            colorScheme="green"
            variant="ghost"
            size="sm"
            ml="2"
            disabled={currentScript.data.enabled}
            onClick={() => setEnabled(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsTab;
