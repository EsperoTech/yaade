import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  IconButton,
  Tab,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { Dispatch, useState } from 'react';
import {
  VscArrowDown,
  VscArrowUp,
  VscChevronDown,
  VscChevronRight,
} from 'react-icons/vsc';

import { WebsocketResponse } from '../../model/Response';
import {
  CurrentRequestAction,
  CurrentRequestActionType,
} from '../../state/currentRequest';
import { cn } from '../../utils';
import styles from './WebsocketResponsePanel.module.css';

const dateOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
};

type WebsocketResponsePanelProps = {
  response: WebsocketResponse;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
};

export default function WebsocketResponsePanel({
  response,
  dispatchCurrentRequest,
}: WebsocketResponsePanelProps) {
  const [openedRows, setOpenedRows] = useState<number[]>([]);
  const { colorMode } = useColorMode();

  function handleDeleteResponseClick() {
    dispatchCurrentRequest({
      type: CurrentRequestActionType.CLEAR_WEBSOCKET_RESPONSE_MESSAGES,
    });
  }
  return (
    <Box className={styles.container} bg="panelBg" h="100%">
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
            <Tab>Messages</Tab>
          </TabList>
          <div>
            {response.date && (
              <>
                Date
                <span className={styles.statusText}>{response.date}</span>
              </>
            )}
            <IconButton
              aria-label="delete-response-button"
              icon={<DeleteIcon />}
              variant="ghost"
              size="sm"
              ml="2"
              disabled={!response}
              onClick={handleDeleteResponseClick}
            />
          </div>
        </div>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }}>
          <TabPanel>
            <div>
              <TableContainer overflow="hidden">
                <Table size="sm" whiteSpace="normal">
                  <Thead>
                    <Tr>
                      <Th width="25px" minWidth="25px" maxWidth="25px" p="5px"></Th>
                      <Th width="25px" minWidth="25px" maxWidth="25px" p="5px"></Th>
                      <Th width="150px" minWidth="150px" maxWidth="150px" p="5px">
                        Timestamp
                      </Th>
                      <Th p="5px">Message</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {response.messages?.map((message, i) => (
                      <Tr key={`log-${i}`}>
                        <Td verticalAlign="top" p="5px">
                          {openedRows.includes(i) ? (
                            <VscChevronDown
                              role="button"
                              onClick={() =>
                                setOpenedRows((r) => r.filter((row) => row !== i))
                              }
                            />
                          ) : (
                            <VscChevronRight
                              role="button"
                              onClick={() => setOpenedRows((r) => [...r, i])}
                            />
                          )}
                        </Td>
                        <Td verticalAlign="top" p="5px">
                          {message.type === 'incoming' ? (
                            <VscArrowDown color="var(--chakra-colors-red-300)" />
                          ) : (
                            <VscArrowUp color="var(--chakra-colors-green-300)" />
                          )}
                        </Td>
                        <Td verticalAlign="top" p="5px">
                          {new Date(message.date ?? 0).toLocaleString(
                            'en-GB',
                            dateOptions,
                          )}
                        </Td>
                        <Td
                          className={cn(styles, 'logContainer', [
                            openedRows.includes(i) ? 'open' : 'closed',
                          ])}
                          verticalAlign="top"
                          p="5px"
                        >
                          {message.message}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
