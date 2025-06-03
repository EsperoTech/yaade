import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Center,
  IconButton,
  Tab,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Table } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { Dispatch, UIEvent, useEffect, useRef, useState } from 'react';
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
  response?: WebsocketResponse;
  dispatchCurrentRequest: Dispatch<CurrentRequestAction>;
};

export default function WebsocketResponsePanel({
  response,
  dispatchCurrentRequest,
}: WebsocketResponsePanelProps) {
  const [openedRows, setOpenedRows] = useState<number[]>([]);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const { colorMode } = useColorMode();
  const tabPanelRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);

  const l = response?.messages?.length ?? 0;

  // Add this function to handle scroll events
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop } = event.currentTarget;
    // If we're near the top (within 20px), enable auto-scroll
    setShouldAutoScroll(scrollTop < 20);
  };

  // Add this useEffect to handle auto-scrolling
  useEffect(() => {
    if (tabPanelRef.current && response?.messages) {
      if (shouldAutoScroll) {
        // If auto-scroll is enabled, scroll to top
        tabPanelRef.current.scrollTop = 0;
      } else if (previousMessagesLength.current < response.messages.length) {
        // If new messages were added and auto-scroll is disabled,
        // adjust scroll position to maintain current view
        const newItemsCount = response.messages.length - previousMessagesLength.current;
        const rowHeight = 27; // Approximate height of each row
        tabPanelRef.current.scrollTop += newItemsCount * rowHeight;
      }
      previousMessagesLength.current = response.messages.length;
    }
  }, [response?.messages, shouldAutoScroll]);

  function handleDeleteResponseClick() {
    dispatchCurrentRequest({
      type: CurrentRequestActionType.CLEAR_WEBSOCKET_RESPONSE_MESSAGES,
    });
  }
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
          <TabPanels
            ref={tabPanelRef}
            overflowY="auto"
            sx={{ scrollbarGutter: 'stable' }}
            onScroll={handleScroll}
          >
            <TabPanel>
              <div>
                <TableContainer maxWidth="100%" width="100%" overflowX="hidden">
                  <Table
                    size="sm"
                    whiteSpace="normal"
                    width="100%"
                    sx={{ tableLayout: 'fixed' }}
                  >
                    <Thead>
                      <Tr>
                        <Th width="25px" minWidth="25px" maxWidth="25px" p="5px"></Th>
                        <Th width="25px" minWidth="25px" maxWidth="25px" p="5px"></Th>
                        <Th width="150px" minWidth="150px" maxWidth="150px" p="5px">
                          Timestamp
                        </Th>
                        <Th p="5px" width="100%">
                          Message
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {response.messages?.map((message, i) => (
                        <Tr key={`log-${i}`}>
                          <Td verticalAlign="top" p="5px">
                            {openedRows.includes(l - i) ? (
                              <VscChevronDown
                                role="button"
                                onClick={() =>
                                  setOpenedRows((r) => r.filter((row) => row !== l - i))
                                }
                              />
                            ) : (
                              <VscChevronRight
                                role="button"
                                onClick={() => setOpenedRows((r) => [...r, l - i])}
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
                          <Td verticalAlign="top" p="5px" width="500px">
                            <div
                              className={cn(styles, 'logContainer', [
                                openedRows.includes(l - i) ? 'open' : 'closed',
                              ])}
                            >
                              {message.message}
                            </div>
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
      ) : (
        <Center h="100%">
          <Text>Push connect to start...</Text>
        </Center>
      )}
    </Box>
  );
}
