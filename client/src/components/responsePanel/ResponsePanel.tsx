import { Box } from '@chakra-ui/react';
import { Tab, TabList, TabPanel, TabPanels, Tabs, useColorMode } from '@chakra-ui/react';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

import Response from '../../model/Response';
import KVEditor from '../kvEditor';
import styles from './ResponsePanel.module.css';

type ResponsePanelProps = {
  response?: Response;
};

function ResponsePanel({ response }: ResponsePanelProps) {
  const colorMode = useColorMode();

  return (
    <Box className={styles.container} bg="panelBg">
      {response ? (
        <Tabs colorScheme="green" mt="1">
          <div className={styles.tabList}>
            <TabList className={styles.tabs} borderWidth={0}>
              <Tab>Body</Tab>
              <Tab>Headers</Tab>
            </TabList>
            <div className={styles.statusBar}>
              Status
              <span className={styles.statusText}>200</span>
              Time
              <span className={styles.statusText}>320ms</span>
              Size
              <span className={styles.statusText}>8kB</span>
            </div>
          </div>
          <TabPanels>
            <TabPanel>
              <CodeMirror
                height="100%"
                extensions={[json()]}
                theme={colorMode.colorMode}
                value={response.body}
                editable={false}
              />
            </TabPanel>
            <TabPanel>
              <KVEditor name="response-headers" kvs={response.headers} readOnly />
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <span>Push send to get a response...</span>
      )}
    </Box>
  );
}

export default ResponsePanel;
