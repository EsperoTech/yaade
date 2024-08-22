import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Heading,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Table,
  TableContainer,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';
import { VscCloudUpload } from 'react-icons/vsc';

import api from '../../api';
import { UserContext } from '../../context';
import FileDescription from '../../model/FileDescription';
import { cn, errorToast, successToast } from '../../utils';
import GroupsInput from '../groupsInput';
import styles from './FileSelectorModal.module.css';

type FileSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: FileDescription) => void;
  unsetIfSame: (id: number) => void;
};

type FileSelectorModalState = {
  file: File | undefined;
  groups: string[];
  files: FileDescription[];
};

function FileSelectorModal({
  isOpen,
  onClose,
  onSelectFile,
  unsetIfSame,
}: FileSelectorModalProps) {
  const { colorMode } = useColorMode();
  const { user } = useContext(UserContext);
  const toast = useToast();
  const [state, setState] = useState<FileSelectorModalState>({
    file: undefined,
    groups: user?.data.groups ?? [],
    files: [],
  });
  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await api.getFiles();
        const body = await res.json();
        setState((state) => {
          return { ...state, files: body.files };
        });
      } catch (e) {
        console.error(e);
      }
    }
    fetchFiles();
  }, []);

  async function handleDeleteFileClick(id: number) {
    try {
      const res = await api.deleteFile(id);
      if (res.status !== 200) {
        throw new Error('Could not delete file');
      }
      const newFiles = state.files.filter((f) => f.id !== id);
      setState({ ...state, files: newFiles });
      unsetIfSame(id);
      successToast('File deleted', toast);
    } catch (e) {
      console.error(e);
      errorToast('Could not delete file', toast);
    }
  }

  async function handleUploadFileClick() {
    try {
      if (!state.file) {
        return;
      }
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('groups', state.groups.join(','));
      const res = await api.uploadFile(formData);
      if (res.status !== 200) {
        throw new Error('Could not upload file');
      }
      const f = (await res.json()) as FileDescription;
      setState({
        ...state,
        file: undefined,
        groups: user?.data.groups ?? [],
        files: [...state.files, f],
      });
      onSelectFile(f);
      successToast('File uploaded', toast);
    } catch (e) {
      console.error(e);
      errorToast('Could not upload file', toast);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Files</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb="4">Click on a filename to select it or upload a new one.</Text>
          <TableContainer maxHeight="160px" overflowY="scroll">
            <Table size="sm" whiteSpace="normal">
              <Thead>
                <Tr>
                  <Th p="0" width="300px" maxWidth="350px">
                    File
                  </Th>
                  <Th p="0" width="240px" maxWidth="240px">
                    Groups
                  </Th>
                  <Th width="110px" maxWidth="110px" isNumeric></Th>
                </Tr>
              </Thead>
              <Tbody>
                {state.files?.length == 0 ? (
                  <div style={{ marginTop: '5px' }}>
                    <span>No Files...</span>
                  </div>
                ) : (
                  state.files.map((u, i) => {
                    return (
                      <Tr key={`files-list-${i}`}>
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
                          <div
                            className={styles.filenameText}
                            onClick={() => onSelectFile(u)}
                            role="button"
                            tabIndex={i}
                            onKeyPress={() => onSelectFile(u)}
                          >
                            {u.name}
                          </div>
                        </Td>
                        <Td
                          p="0"
                          overflowX="hidden"
                          verticalAlign="top"
                          padding="8px 0 0 0"
                        >
                          {u.data.groups?.map((group: string) => (
                            <Tag
                              size="sm"
                              key={`files-list-${i}-${group}`}
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
                            onClick={() => handleDeleteFileClick(u.id)}
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
              Upload a new File
            </Heading>

            <input
              id="fileinput"
              className={`${cn(styles, 'fileInput', [colorMode])} ${styles.formField}`}
              type="file"
              onChange={(e) => {
                const file = e.target.files ? e.target.files[0] : undefined;
                if (!file) {
                  return;
                }
                setState({ ...state, file });
              }}
            />

            <GroupsInput
              groups={state.groups}
              setGroups={(groups) => {
                setState({ ...state, groups });
              }}
            />

            <Button
              mt="6"
              mb="6"
              borderRadius={20}
              colorScheme="green"
              w={150}
              onClick={handleUploadFileClick}
              disabled={!state.file}
            >
              Upload
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default FileSelectorModal;
