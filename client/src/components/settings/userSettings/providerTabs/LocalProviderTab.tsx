import { CheckIcon, CloseIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Heading,
  HStack,
  IconButton,
  Input,
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
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Dispatch, FunctionComponent, SetStateAction, useContext, useState } from 'react';

import { UserContext } from '../../../../context';
import User from '../../../../model/User';
import { errorToast, successToast } from '../../../../utils';
import BasicModal from '../../../basicModal';
import GroupsInput from '../../../groupsInput';

type LocalProviderTabProps = {
  users: User[];
  setUsers: (users: User[]) => void;
};

type LocalProviderTabState = {
  users: User[];
};

type EditRowForm = {
  i: number;
  groups: string[];
  deleteUser?: User;
};

type NewUserForm = {
  username: string;
  groups: string[];
};

const LocalProviderTab: FunctionComponent<LocalProviderTabProps> = ({
  users,
  setUsers,
}) => {
  const [editRowForm, setEditRowForm] = useState<EditRowForm>({
    i: -1,
    groups: [],
  });
  const [newUserForm, setNewUserForm] = useState<NewUserForm>({
    username: '',
    groups: [],
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode } = useColorMode();
  const { user } = useContext(UserContext);
  const toast = useToast();

  function handleEditLocalUserClicked(i: number) {
    const editUser = users[i];
    const groups = editUser.data?.groups ?? [];
    setEditRowForm({ ...editRowForm, i, groups });
  }

  async function addNewLocalUser(username: string, groups: string[]) {
    try {
      const newUser = { username, groups };
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (res.status === 200) {
        successToast('User created', toast);

        const usersRes = await fetch('/api/users');
        const newUsers = (await usersRes.json()) as Array<User>;

        setNewUserForm({ ...newUserForm, username: '', groups: [] });
        setUsers(newUsers);
      } else if (res.status === 409) {
        errorToast('User already exists', toast);
      } else {
        throw new Error('Could not create user');
      }
    } catch (e) {
      errorToast('User could not be created', toast);
    }
  }

  async function saveEditLocalUser() {
    try {
      if (editRowForm.i === -1) return;

      const editUser = users[editRowForm.i];
      editUser.data.groups = editRowForm.groups;

      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(editUser),
      });

      if (res.status !== 200) {
        throw new Error('Could not save user');
      }

      const newUsers = users;
      newUsers[editRowForm.i] = editUser;

      setUsers(newUsers);
      setEditRowForm({ ...editRowForm, i: -1 });
    } catch (e) {
      errorToast('Failed to save', toast);
      setEditRowForm({ ...editRowForm, i: -1 });
    }
  }

  async function deleteLocalUser() {
    try {
      const userId = editRowForm.deleteUser?.id;
      if (!userId) throw new Error('User id has to be set');

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.status === 200) {
        const newUsers = users.filter((el) => el.id !== userId);

        setEditRowForm({ ...editRowForm, deleteUser: undefined });
        setUsers(newUsers);

        successToast('User deleted', toast);
        onClose();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (e) {
      errorToast('Could not delete user', toast);
    }
  }

  return (
    <>
      <Heading as="h4" size="md" mb="2" mt="2">
        Add a new user
      </Heading>
      <HStack mb="4" alignItems="start">
        <Input
          size="sm"
          placeholder="Username"
          width="130px"
          value={newUserForm.username}
          onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
        />
        <VStack alignItems="start" width="320px">
          <GroupsInput
            groups={newUserForm.groups}
            setGroups={(groups: string[]) => setNewUserForm({ ...newUserForm, groups })}
          />
        </VStack>
        <div>
          <IconButton
            aria-label="add-new-user"
            isRound
            variant="ghost"
            size="sm"
            disabled={newUserForm.username === ''}
            onClick={() => addNewLocalUser(newUserForm.username, newUserForm.groups)}
            colorScheme="green"
            icon={<CheckIcon />}
          />
        </div>
      </HStack>
      <TableContainer>
        <Table size="sm" whiteSpace="normal">
          <Thead>
            <Tr>
              <Th p="0" width="150px" maxWidth="150px">
                Username
              </Th>
              <Th p="0" width="240px" maxWidth="240px">
                Groups
              </Th>
              <Th width="110px" maxWidth="110px" isNumeric></Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((u, i) => {
              return editRowForm.i === i ? (
                <Tr key={`admin-user-list-${i}`}>
                  <Td p="0" verticalAlign="top" padding="12px 0 0 0">
                    {u.username}
                  </Td>
                  <Td p="0" verticalAlign="top" padding="4px 0 0 0">
                    <GroupsInput
                      groups={editRowForm.groups}
                      setGroups={(groups: string[]) =>
                        setEditRowForm({ ...editRowForm, groups })
                      }
                    />
                  </Td>
                  <Td p="0" verticalAlign="top">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'end',
                      }}
                    >
                      <IconButton
                        aria-label="save-user-edit"
                        isRound
                        variant="ghost"
                        onClick={saveEditLocalUser}
                        colorScheme="green"
                        icon={<CheckIcon />}
                      />
                      <IconButton
                        aria-label="cancel-user-edit"
                        isRound
                        variant="ghost"
                        onClick={() => setEditRowForm({ ...editRowForm, i: -1 })}
                        colorScheme="red"
                        icon={<CloseIcon />}
                      />
                    </div>
                  </Td>
                </Tr>
              ) : (
                <Tr key={`admin-user-list-${i}`}>
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
                    {u.username}
                  </Td>
                  <Td p="0" overflowX="hidden" verticalAlign="top" padding="8px 0 0 0">
                    {u.data?.groups?.map((group: string) => (
                      <Tag
                        size="sm"
                        key={`admin-user-list-${i}-${group}`}
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
                      aria-label="edit-row"
                      isRound
                      variant="ghost"
                      onClick={() => handleEditLocalUserClicked(i)}
                      icon={<EditIcon />}
                    />
                    <IconButton
                      aria-label="delete-row"
                      isRound
                      variant="ghost"
                      onClick={() => {
                        setEditRowForm({ ...editRowForm, deleteUser: u });
                        onOpen();
                      }}
                      disabled={u.username === user?.username}
                      color={colorMode === 'light' ? 'red.500' : 'red.300'}
                      icon={<DeleteIcon />}
                    />
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
      <BasicModal
        isOpen={isOpen}
        initialRef={undefined}
        onClose={onClose}
        heading={`Delete "${editRowForm.deleteUser?.username}"`}
        onClick={deleteLocalUser}
        buttonText="Delete"
        buttonColor="red"
        isButtonDisabled={false}
      >
        Are you sure you want to delete this user?
      </BasicModal>
    </>
  );
};

export default LocalProviderTab;
