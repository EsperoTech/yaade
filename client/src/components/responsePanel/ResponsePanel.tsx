import { Box, Center } from '@chakra-ui/react';
import {
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

import Response from '../../model/Response';
import { cn } from '../../utils';
import KVEditor from '../kvEditor';
import styles from './ResponsePanel.module.css';

type ResponsePanelProps = {
  response?: Response;
};

function ResponsePanel({ response }: ResponsePanelProps) {
  const { colorMode } = useColorMode();

  return (
    <Box className={styles.container} bg="panelBg" h="100%">
      {response ? (
        <Tabs
          colorScheme="green"
          mt="1"
          display="flex"
          flexDirection="column"
          maxHeight="100%"
        >
          <div className={cn(styles, 'tabList', [colorMode])}>
            <TabList borderWidth={0}>
              <Tab>Body</Tab>
              <Tab>Headers</Tab>
            </TabList>
            <div>
              Status
              <span className={styles.statusText}>{response.status}</span>
              Time
              <span className={styles.statusText}>{response.time}</span>
              Size
              <span className={styles.statusText}>{response.size}</span>
            </div>
          </div>
          <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }}>
            <TabPanel>
              <CodeMirror
                height="100%"
                extensions={[json()]}
                theme={colorMode}
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
        <Center h="100%">
          <Text>Push send to get a response...</Text>
        </Center>
      )}
    </Box>
  );
}

export default ResponsePanel;
