import { CopyIcon } from '@chakra-ui/icons';
import { Box, Center, useClipboard } from '@chakra-ui/react';
import {
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { xml } from '@codemirror/lang-xml';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

import KVRow from '../../model/KVRow';
import Response from '../../model/Response';
import { cn, successToast } from '../../utils';
import { json } from '../../utils/codemirror/lang-json';
import KVEditor from '../kvEditor';
import styles from './ResponsePanel.module.css';

function getExtensions(contentType: string): Array<any> {
  let extensions = [];

  if (contentType.includes('application/json')) {
    extensions.push(json());
  } else if (
    contentType.includes('application/xml') ||
    contentType.includes('text/html')
  ) {
    extensions.push(xml());
  }

  return extensions;
}

type ResponsePanelProps = {
  response: Response | undefined;
};

const getContentType = (headers: Array<KVRow>) =>
  headers.find((header) => header.key.toLowerCase() === 'content-type')?.value ?? '';

function ResponsePanel({ response }: ResponsePanelProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { onCopy } = useClipboard(response?.body ?? '');

  function handleCopyToClipboardClick() {
    onCopy();
    successToast('Copied to clipboard', toast);
  }

  const contentType = getContentType(response?.headers ?? []);

  const extensions = getExtensions(contentType);

  return (
    <Box className={styles.container} bg="panelBg" h="100%">
      {response ? (
        <Tabs
          isLazy
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
              {response.date && (
                <>
                  Date
                  <span className={styles.statusText}>{response.date}</span>
                </>
              )}
              <IconButton
                aria-label="save-request-button"
                icon={<CopyIcon />}
                variant="ghost"
                size="sm"
                ml="2"
                disabled={!response || !response.body}
                onClick={handleCopyToClipboardClick}
              />
            </div>
          </div>
          <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }}>
            <TabPanel>
              <CodeMirror
                height="100%"
                extensions={extensions}
                theme={colorMode}
                value={response.body}
                editable={false}
              />
            </TabPanel>
            <TabPanel>
              <KVEditor
                name="response-headers"
                kvs={response.headers}
                readOnly
                hasEnvSupport="NONE"
              />
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
