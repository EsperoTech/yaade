import { Box } from '@chakra-ui/react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { ResizableBox } from 'react-resizable';

import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

function RequestPanel() {
  const vh = Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0,
  );

  return (
    <ResizableBox
      className={styles.container}
      width={Infinity}
      height={200}
      maxConstraints={[Infinity, vh * 0.8]}
      axis="y"
      handle={<span className={styles.handle} />}
      handleSize={[8, 8]}
    >
      <Box className={styles.box} bg="panelBg" h="100%">
        <UriBar />
        <Tabs colorScheme="green" mt="1">
          <TabList>
            <Tab>Parameters</Tab>
            <Tab>Headers</Tab>
            <Tab>Body</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <p>one!</p>
            </TabPanel>
            <TabPanel>
              <p>two!</p>
            </TabPanel>
            <TabPanel>
              <p>three!</p>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </ResizableBox>
  );
}

export default RequestPanel;
