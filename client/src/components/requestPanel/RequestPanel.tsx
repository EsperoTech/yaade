import { Box } from '@chakra-ui/react';
import { IconButton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { VscSave } from 'react-icons/vsc';

import KVRow from '../../model/KVRow';
import Request from '../../model/Request';
import BodyEditor from '../bodyEditor';
import KVEditor from '../kvEditor';
import UriBar from '../uriBar';
import styles from './RequestPanel.module.css';

type RequestPanelProps = {
  request: Request;
  setRequest: Dispatch<SetStateAction<Request>>;
  handleSendButtonClick: () => void;
  handleSaveRequestClick: () => void;
};

const defaultParam = {
  key: '',
  value: '',
};

function shouldAppendNewRow(params: Array<KVRow>): boolean {
  if (params.length === 0) return true;
  const { key, value } = params[params.length - 1];
  return key !== '' || value !== '';
}

function getParamsFromUri(uri: string): Array<KVRow> {
  try {
    const paramString = uri.split('?')[1];
    const params = paramString.split('&').map((kv) => {
      const [k, ...v] = kv.split('=');
      return {
        key: k,
        value: v.join('='),
      };
    });
    if (shouldAppendNewRow(params)) {
      params.push(defaultParam);
    }
    return params;
  } catch (e) {
    return [defaultParam];
  }
}

function RequestPanel({
  request,
  setRequest,
  handleSendButtonClick,
  handleSaveRequestClick,
}: RequestPanelProps) {
  const setUri = (uri: string) => {
    setRequest((request: Request) => ({
      ...request,
      data: {
        ...request.data,
        uri,
      },
    }));
  };

  const params = getParamsFromUri(request.data.uri);

  const headers =
    request.data.headers && request.data.headers.length !== 0
      ? request.data.headers
      : [{ key: '', value: '' }];

  const setMethod = (method: string) => {
    setRequest((request: Request) => ({
      ...request,
      data: {
        ...request.data,
        method,
      },
    }));
  };

  function setUriFromParams(params: Array<KVRow>) {
    try {
      let uri = request.data.uri;
      if (!request.data.uri.includes('?')) {
        uri += '?';
      }
      const base = uri.split('?')[0];
      let searchParams = '';
      for (let i = 0; i < params.length; i++) {
        if (params[i].key === '' && params[i].value === '') {
          continue;
        }
        if (i !== 0) searchParams += '&';
        searchParams += `${params[i].key}=${params[i].value}`;
      }
      if (searchParams === '') {
        setUri(base);
      } else {
        setUri(`${base}?${searchParams}`);
      }
    } catch (e) {
      console.log(e);
    }
  }

  const setHeaders = (headers: Array<KVRow>) => {
    setRequest((request: Request) => ({
      ...request,
      data: {
        ...request.data,
        headers,
      },
    }));
  };

  const setBody = (body: string) => {
    setRequest((request: Request) => ({
      ...request,
      data: {
        ...request.data,
        body,
      },
    }));
  };

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <UriBar
          uri={request.data.uri}
          setUri={setUri}
          method={request.data.method}
          setMethod={setMethod}
          handleSendButtonClick={handleSendButtonClick}
          isLoading={request.isLoading}
        />
        <IconButton
          aria-label="save-request-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          onClick={handleSaveRequestClick}
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
            <KVEditor name="params" kvs={params} setKvs={setUriFromParams} />
          </TabPanel>
          <TabPanel>
            <KVEditor name="headers" kvs={headers} setKvs={setHeaders} />
          </TabPanel>
          <TabPanel h="100%">
            <BodyEditor content={request.data.body} setContent={setBody} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

export default RequestPanel;
