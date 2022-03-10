import { Box } from '@chakra-ui/react';
import {
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useToast,
} from '@chakra-ui/react';
import { VscSave } from 'react-icons/vsc';

import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import BodyEditor from '../bodyEditor';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

type RequestPanelProps = {
  request: Request;
  setRequest: any;
  handleSendButtonClick: () => void;
};

function RequestPanel({ request, setRequest, handleSendButtonClick }: RequestPanelProps) {
  const toast = useToast();

  const setUri = (uri: string) => {
    setRequest((request: Request) => ({
      ...request,
      uri,
    }));
  };

  const setMethod = (method: string) => {
    setRequest((request: Request) => ({
      ...request,
      method,
    }));
  };

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

  async function saveRequest() {
    try {
      const response = await fetch('/api/request', {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      if (response.status !== 200) throw new Error();
      toast({
        title: 'Request saved.',
        description: 'The request was successfully saved.',
        status: 'success',
        isClosable: true,
      });
    } catch (e) {
      console.log(e);
      toast({
        title: 'Save failed.',
        description: 'The request could not be saved.',
        status: 'error',
        isClosable: true,
      });
    }
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <UriBar
          uri={request.uri}
          setUri={setUri}
          method={request.method}
          setMethod={setMethod}
          handleSendButtonClick={handleSendButtonClick}
        />
        <IconButton
          aria-label="save-request-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          onClick={saveRequest}
        />
      </div>

      <Tabs
        colorScheme="green"
        mt="1"
        display="flex"
        flexDirection="column"
        maxHeight="100%"
        h="100%"
        mb="4"
      >
        <TabList>
          <Tab>Parameters</Tab>
          <Tab>Headers</Tab>
          <Tab>Body</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel>
            <KVEditor name="params" kvs={request.params} setKvs={setParams} />
          </TabPanel>
          <TabPanel>
            <KVEditor name="headers" kvs={request.headers} setKvs={setHeaders} />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor content={request.body} setContent={setBody} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default RequestPanel;
