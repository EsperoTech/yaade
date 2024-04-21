import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Heading,
  IconButton,
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
} from '@chakra-ui/react';
import { FunctionComponent, useEffect, useState } from 'react';

import Certificate, { CreateCertificateRequest } from '../../../model/Certificate';
import { KVFileRow } from '../../../model/KVRow';
import { BASE_PATH, errorToast, successToast } from '../../../utils';
import { encodeFormDataBody } from '../../../utils/encodeRequests';
import SettingsTab from '../settingsTab';
import CertificateForm from './CertificateForm';

type CertificateSettingsState = {
  certificates: Certificate[];
  showAddCertificate: boolean;
  newCertificate: CreateCertificateRequest;
};

const defaultCreateCertificate: CreateCertificateRequest = {
  host: '',
  type: 'pem',
  groups: [],
  pemCert: undefined,
};

const CertificateSettings: FunctionComponent = () => {
  const [state, setState] = useState<CertificateSettingsState>({
    certificates: [
      {
        host: 'test',
        type: 'pem',
        groups: ['group1', 'group2'],
      },
      {
        host: 'test2',
        type: 'pem',
        groups: ['group1', 'someLongerGroupName'],
      },
    ],
    showAddCertificate: false,
    newCertificate: defaultCreateCertificate,
  });

  const { colorMode } = useColorMode();
  const toast = useToast();

  // useEffect(() => {
  //   const getCertificates = async () => {
  //     try {
  //       const res = await fetch(BASE_PATH + 'api/certificates');
  //       const resObject = await res.json();
  //       const certificates = resObject.certificates as Array<Certificate>;

  //       setState((s) => {
  //         return { ...s, certificates };
  //       });
  //     } catch (e) {
  //       errorToast('Certificate could not be fetched.', toast);
  //     }
  //   };
  //   getCertificates();
  // }, []);

  function setCertificates(certificates: CreateCertificateRequest[]) {
    setState((s) => {
      return { ...s, certificates };
    });
  }

  async function handleAddCertificate() {
    try {
      const formDataBody = await encodeFormDataBody(
        mapNewCertificateToKVFileRows(state.newCertificate),
      );
      const res = await fetch(BASE_PATH + 'api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formDataBody,
      });

      if (res.status === 200) {
        successToast('Certificate created', toast);

        const res = await fetch(BASE_PATH + 'api/certificates');
        const resObject = await res.json();
        const certificates = resObject.certificates as Array<Certificate>;

        setState((s) => {
          return {
            ...s,
            showAddCertificate: false,
            newCertificate: defaultCreateCertificate,
            certificates,
          };
        });
      } else if (res.status === 409) {
        errorToast('Certificate already exists', toast);
      } else {
        throw new Error('Could not create user');
      }
    } catch (e) {
      errorToast('Certificate could not be created: ' + e, toast);
    }
  }

  function resetAddCertificate() {
    setState((s) => {
      return {
        ...s,
        showAddCertificate: false,
        newCertificate: defaultCreateCertificate,
      };
    });
  }

  function onChangeNewCertificate(newCertificate: CreateCertificateRequest) {
    setState((s) => {
      return { ...s, newCertificate: newCertificate };
    });
  }

  function mapNewCertificateToKVFileRows(
    newCertificate: CreateCertificateRequest,
  ): KVFileRow[] {
    return Object.entries(newCertificate).map(([key, value]) => {
      if (key === 'pemCert') {
        return { key, value, isFile: true };
      }
      return { key, value };
    });
  }

  return (
    <SettingsTab name="Certificates">
      <TableContainer overflowY="scroll">
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
            {state.certificates.length == 0 ? (
              <div style={{ marginTop: '5px' }}>
                <span> No certificates</span>
              </div>
            ) : (
              state.certificates.map((u, i) => {
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
                      {u.host}
                    </Td>
                    <Td p="0" overflowX="hidden" verticalAlign="top" padding="8px 0 0 0">
                      {u.groups.map((group: string) => (
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
                        onClick={() => {
                          errorToast('Not implemented', toast);
                        }}
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
        {!state.showAddCertificate && (
          <Button
            borderRadius={20}
            colorScheme="green"
            w={150}
            onClick={() => {
              setState((s) => {
                return { ...s, showAddCertificate: true };
              });
            }}
          >
            Add Certificate
          </Button>
        )}

        {state.showAddCertificate && (
          <>
            <Heading as="h4" size="md" mb="2" mt="2">
              Add a new certificate
            </Heading>

            <CertificateForm
              newCertificate={state.newCertificate}
              onChangeNewCertificate={onChangeNewCertificate}
            />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button
                mt="4"
                borderRadius={20}
                colorScheme="green"
                w={150}
                onClick={handleAddCertificate}
              >
                Add
              </Button>
              <Button
                mt="4"
                borderRadius={20}
                colorScheme="red"
                w={150}
                onClick={resetAddCertificate}
                style={{ marginLeft: '10px' }}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </div>
    </SettingsTab>
  );
};

export default CertificateSettings;
