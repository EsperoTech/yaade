import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useState } from 'react';
import {
  VscArrowDown,
  VscArrowLeft,
  VscArrowRight,
  VscChevronDown,
  VscChevronRight,
} from 'react-icons/vsc';

import { ScriptLog } from '../../../model/Script';
import { cn } from '../../../utils';
import styles from './LogsTab.module.css';

const dateOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
};

function parseToString(message: any): string {
  if (message === null) {
    return 'null';
  } else if (typeof message === 'string') {
    return message;
  } else if (typeof message === 'object') {
    try {
      return JSON.stringify(message);
    } catch (e) {
      return message.toString();
    }
  } else if (typeof message === 'undefined') {
    return 'undefined';
  } else if (typeof message === 'number') {
    return message.toString();
  } else if (typeof message === 'boolean') {
    return message.toString();
  }
  return '';
}

type LogsTabProps = {
  logs: ScriptLog[];
};

const LogsTab = ({ logs }: LogsTabProps) => {
  const [openedRows, setOpenedRows] = useState<number[]>([]);
  return (
    <div className={styles.container}>
      <TableContainer overflow="hidden">
        <Table size="sm" whiteSpace="normal">
          <Thead>
            <Tr>
              <Th width="25px" minWidth="25px" maxWidth="25px" p="5px"></Th>
              <Th width="150px" minWidth="150px" maxWidth="150px" p="5px">
                Timestamp
              </Th>
              <Th p="5px">Message</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.map((log, i) => (
              <Tr key={`log-${i}`}>
                <Td verticalAlign="top" p="5px">
                  {openedRows.includes(i) ? (
                    <VscChevronDown
                      role="button"
                      onClick={() => setOpenedRows((r) => r.filter((row) => row !== i))}
                    />
                  ) : (
                    <VscChevronRight
                      role="button"
                      onClick={() => setOpenedRows((r) => [...r, i])}
                    />
                  )}
                </Td>
                <Td verticalAlign="top" p="5px">
                  {new Date(log.time ?? 0).toLocaleString('en-GB', dateOptions)}
                </Td>
                <Td
                  className={cn(styles, 'logContainer', [
                    openedRows.includes(i) ? 'open' : 'closed',
                  ])}
                  verticalAlign="top"
                  p="5px"
                >
                  {parseToString(log.message)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default LogsTab;
