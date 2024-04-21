import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Table,
  TableContainer,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useColorMode,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FunctionComponent, useEffect, useRef, useState } from 'react';

import Certificate from '../../../model/Certificate';
import { BASE_PATH, cn, errorToast, successToast } from '../../../utils';
import GroupsInput from '../../groupsInput';
import SettingsTab from '../settingsTab';
import styles from './CertificateSettings.module.css';

type CertificateSettingsState = {
  certificates: Certificate[];
  showAddCertificate: boolean;
};

type CreateNewCertificateState = {
  host: string;
  type: string;
  groups: string[];
  pemCert?: File;
};

const defaultCreateCertificate: CreateNewCertificateState = {
  host: '',
  type: 'pem',
  groups: [],
};

const CertificateSettings: FunctionComponent = () => {
  const [state, setState] = useState<CertificateSettingsState>({
    certificates: [],
    showAddCertificate: false,
  });
  const [newCertState, setNewCertState] = useState<CreateNewCertificateState>(
    defaultCreateCertificate,
  );

  const { colorMode } = useColorMode();
  const toast = useToast();
  const pemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const getCertificates = async () => {
      try {
        const res = await fetch(BASE_PATH + 'api/certificates');
        const resObject = await res.json();
        const certificates = resObject.certificates as Array<Certificate>;

        setState((s) => {
          return { ...s, certificates };
        });
      } catch (e) {
        errorToast('Certificate could not be fetched.', toast);
      }
    };
    getCertificates();
  }, [toast]);

  async function handleAddCertificateClick() {
    try {
      const formdata = new FormData();
      formdata.append('host', newCertState.host);
      formdata.append('type', newCertState.type);
      if (newCertState.groups.length > 0) {
        formdata.append('groups', newCertState.groups.join(','));
      }
      if (newCertState.type === 'pem' && newCertState.pemCert) {
        formdata.append('pemCert', newCertState.pemCert!);
      }

      const res = await fetch(BASE_PATH + 'api/certificates', {
        method: 'POST',
        body: formdata,
      });

      if (res.status === 200) {
        const newCert = (await res.json()) as Certificate;

        setState({ ...state, certificates: [...state.certificates, newCert] });
        setNewCertState(defaultCreateCertificate);
        pemInputRef.current!.value = '';
        successToast('Certificate created', toast);
      } else if (res.status === 409) {
        errorToast('Certificate already exists', toast);
      } else {
        throw new Error();
      }
    } catch (e) {
      errorToast('Certificate could not be created', toast);
    }
  }

  function handleDeleteCertificateClick(id: number) {
    try {
      fetch(BASE_PATH + 'api/certificates/' + id, {
        method: 'DELETE',
      });

      setState((s) => {
        return {
          ...s,
          certificates: s.certificates.filter((c) => c.id !== id),
        };
      });

      successToast('Certificate deleted', toast);
    } catch (e) {
      errorToast('Certificate could not be deleted.', toast);
    }
  }

  function onChangeNewCertificate(newCertificate: CreateNewCertificateState) {
    setNewCertState({ ...newCertificate });
  }

  function validateForm(): boolean {
    if (newCertState.host === '') {
      return false;
    }

    if (newCertState.type === 'pem' && !newCertState.pemCert) {
      return false;
    }

    return true;
  }

  return (
    <SettingsTab name="Certificates">
      <TableContainer maxHeight="200px" overflowY="scroll">
        <Table size="sm" whiteSpace="normal">
          <Thead>
            <Tr>
              <Th p="0" width="300px" maxWidth="350px">
                Host
              </Th>
              <Th p="0" width="240px" maxWidth="240px">
                Groups
              </Th>
              <Th width="110px" maxWidth="110px" isNumeric></Th>
            </Tr>
          </Thead>
          <Tbody>
            {state.certificates?.length == 0 ? (
              <div style={{ marginTop: '5px' }}>
                <span> No certificates</span>
              </div>
            ) : (
              state.certificates?.map((u, i) => {
                return (
                  <Tr key={`certificate-list-${i}`}>
                    <Td
                      p="0"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                      width="150px"
                      maxWidth="150px"
                      overflow="hidden"
                      verticalAlign="top"
                      padding="12px 0 0 0"
                    >
                      {u.data.host}
                    </Td>
                    <Td p="0" overflowX="hidden" verticalAlign="top" padding="8px 0 0 0">
                      {u.data.groups.map((group: string) => (
                        <Tag
                          size="sm"
                          key={`certificate-list-${i}-${group}`}
                          borderRadius="full"
                          variant="solid"
                          colorScheme="green"
                          mr="0.5rem"
                          my="0.2rem"
                        >
                          <TagLabel>{group}</TagLabel>
                        </Tag>
                      ))}
                    </Td>
                    <Td p="0" isNumeric verticalAlign="top">
                      <IconButton
                        aria-label="delete-row"
                        isRound
                        variant="ghost"
                        onClick={() => handleDeleteCertificateClick(u.id)}
                        color={colorMode === 'light' ? 'red.500' : 'red.300'}
                        icon={<DeleteIcon />}
                      />
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </Table>
      </TableContainer>
      <hr style={{ marginTop: '10px' }} />
      <div style={{ marginTop: '10px' }}>
        <Heading as="h4" size="md" mb="2" mt="4">
          Add a new Certificate
        </Heading>
        <Input
          size="sm"
          placeholder="Host"
          mb="2"
          backgroundColor={colorMode === 'light' ? 'white' : undefined}
          value={newCertState.host}
          onChange={(e) =>
            onChangeNewCertificate({ ...newCertState, host: e.target.value })
          }
        />
        <HStack alignItems="start">
          <Select
            id="type"
            value={newCertState.type}
            size="sm"
            onChange={(e) => {
              onChangeNewCertificate({ ...newCertState, type: e.target.value });
            }}
          >
            <option key={'pem'} value={'pem'}>
              pem
            </option>
          </Select>
          <GroupsInput
            groups={newCertState.groups}
            setGroups={(groups) => {
              onChangeNewCertificate({ ...newCertState, groups });
            }}
          />
        </HStack>

        <HStack mb="4">
          <label
            htmlFor="pemCert"
            className={styles.fieldLabel}
            style={{ width: '160px' }}
          >
            Pem Certificate
          </label>
          <input
            id="pemCert"
            ref={pemInputRef}
            className={`${cn(styles, 'fileInput', [colorMode])} ${styles.formField}`}
            type="file"
            accept=".pem"
            onChange={(e) => {
              const pemCert = e.target.files ? e.target.files[0] : undefined;
              if (!pemCert) {
                return;
              }
              onChangeNewCertificate({ ...newCertState, pemCert });
            }}
          />
        </HStack>
        <Button
          mt="4"
          borderRadius={20}
          colorScheme="green"
          w={150}
          onClick={handleAddCertificateClick}
          disabled={!validateForm()}
        >
          Add
        </Button>
      </div>
    </SettingsTab>
  );
};

export default CertificateSettings;
