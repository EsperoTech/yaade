import { Box } from '@chakra-ui/react';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';

import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import BodyEditor from '../bodyEditor';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

type RequestPanelProps = {
  request: Request;
  setRequest: any;
  handleSendButtonClicked: () => void;
};

function RequestPanel({
  request,
  setRequest,
  handleSendButtonClicked,
}: RequestPanelProps) {
  const setParams = (params: Array<KVRow>) => {
    setRequest((request: Request) => ({
      ...request,
      params,
    }));
  };

  const setHeaders = (headers: Array<KVRow>) => {
    setRequest((request: Request) => ({
      ...request,
      headers,
    }));
  };

  const setBody = (body: string) => {
    setRequest((request: Request) => ({
      ...request,
      body,
    }));
  };

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <UriBar handleSendButtonClicked={handleSendButtonClicked} />
      <Tabs colorScheme="green" mt="1">
        <TabList>
          <Tab>Parameters</Tab>
          <Tab>Headers</Tab>
          <Tab>Body</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <KVEditor name="params" kvs={request.params} setKvs={setParams} />
          </TabPanel>
          <TabPanel>
            <KVEditor name="headers" kvs={request.headers} setKvs={setHeaders} />
          </TabPanel>
          <TabPanel>
            <BodyEditor content={request.body} setContent={setBody} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default RequestPanel;
