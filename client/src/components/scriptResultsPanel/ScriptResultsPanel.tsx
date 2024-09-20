import { Box, Center } from '@chakra-ui/react';
import {
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { VscError, VscPass, VscRefresh } from 'react-icons/vsc';

import { ScriptResult } from '../../model/Script';
import { cn } from '../../utils';
import LogsTab from './logsTab';
import styles from './ScriptResultsPanel.module.css';
import TestsTab from './testsTab';

type ScriptResultsPanelProps = {
  results?: ScriptResult[];
  onRefreshResults: () => void;
  forceSetScriptResult: React.MutableRefObject<(result: ScriptResult) => void>;
};

const dateOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
};

function isRunSuccess(result: ScriptResult): boolean {
  if (!result.success) return false;
  const suites = result.jasmineReport?.suites;
  if (!suites || !Array.isArray(suites)) return false;
  return suites.every((suite) => suite.status === 'passed');
}

function ScriptResultsPanel({
  results,
  onRefreshResults,
  forceSetScriptResult,
}: ScriptResultsPanelProps) {
  const { colorMode } = useColorMode();
  const [selectedResult, setSelectedResult] = useState<ScriptResult | undefined>(
    results?.[0],
  );

  useEffect(() => {
    forceSetScriptResult.current = (result) => {
      setSelectedResult(result);
    };
  });

  return (
    <Box className={styles.container} bg="panelBg" h="100%">
      {results ? (
        <>
          <div className={styles.resultsList}>
            <div className={styles.resultsListHeader}>
              <div>Runs</div>
              <IconButton
                aria-label="Refresh"
                icon={<VscRefresh />}
                isRound
                variant="ghost"
                size="sm"
                onClick={onRefreshResults}
              />
            </div>
            <div className={styles.resultsListElements}>
              {results.map((result) => (
                <div
                  key={result.executionTime}
                  className={cn(styles, 'resultElement', [
                    colorMode,
                    selectedResult?.executionTime === result.executionTime
                      ? 'selected'
                      : '',
                  ])}
                  onClick={() => setSelectedResult(result)}
                  tabIndex={0}
                  onKeyPress={(e) => setSelectedResult(result)}
                  role="button"
                >
                  {isRunSuccess(result) ? (
                    <VscPass style={{ color: 'var(--chakra-colors-green-500)' }} />
                  ) : (
                    <VscError style={{ color: 'var(--chakra-colors-red-500)' }} />
                  )}
                  <div
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {new Date(result.executionTime ?? 0).toLocaleString(
                      'en-GB',
                      dateOptions,
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.selectedResult}>
            <Tabs isLazy colorScheme="green">
              <TabList>
                <Tab>Tests</Tab>
                <Tab>Logs</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <TestsTab
                    suites={selectedResult?.jasmineReport?.suites ?? []}
                    error={selectedResult?.error}
                  />
                </TabPanel>
                <TabPanel>
                  <LogsTab logs={selectedResult?.logs ?? []} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </div>
        </>
      ) : (
        <Center h="100%" w="100%">
          <Text>Push run to get a result...</Text>
        </Center>
      )}
    </Box>
  );
}

export default ScriptResultsPanel;
