import { CloseIcon, EditIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { CheckIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Divider,
  Heading,
  HStack,
  IconButton,
  Input,
  ModalCloseButton,
  Stack,
  Switch,
  Tab,
  Table,
  TableContainer,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useContext, useEffect, useState } from 'react';

import { UserContext } from '../../context';
import User from '../../model/User';
import {
  cn,
  errorToast,
  groupsArrayToStr,
  groupsStrToArray,
  successToast,
} from '../../utils';
import BasicModal from '../basicModal';
import styles from './Settings.module.css';

type SettingsTabProps = {
  name: string;
  children: any;
};

function SettingsTab({ name, children }: SettingsTabProps) {
  return (
    <div className={styles.settingsTabContainer}>
      <div style={{ display: 'flex' }}>
        <Heading mb="4">{name}</Heading>
        <ModalCloseButton ml="auto" size="md" />
      </div>
      <Divider mb="4" />
      {children}
    </div>
  );
}

type SettingsState = {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
  backupfile: any;
  acknowledge: boolean;
};

type AdminState = {
  users: Array<User>;
  userAddUsername: string;
  userAddGroups: string;
  userRowEditIdx: number;
  userRowEditGroups: string;
  deleteUser: User | undefined;
};

const defaultState: SettingsState = {
  currentPassword: '',
  newPassword: '',
  repeatPassword: '',
  backupfile: undefined,
  acknowledge: false,
};

const defaultAdminState: AdminState = {
  users: [],
  userAddUsername: '',
  userAddGroups: '',
  userRowEditIdx: -1,
  userRowEditGroups: '',
  deleteUser: undefined,
};

const sx = {
  borderRadius: '0 20px 20px 0',
  borderWidth: '0px',
  justifyContent: 'start',
  paddingLeft: '2rem',
  boxSizing: 'border-box',
};

function Settings() {
  const [state, setState] = useState<SettingsState>(defaultState);
  const [adminState, setAdminState] = useState<AdminState>(defaultAdminState);
  const { user, setUser, isAdmin } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, setColorMode } = useColorMode();
  const toast = useToast();

  useEffect(() => {
    if (!isAdmin()) return;

    const setUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const users = await res.json();
        console.log(users);
        setAdminState((adminState) => {
          return {
            ...adminState,
            users,
          };
        });
      } catch (e) {
        errorToast('Users could not be fetched.', toast);
      }
    };

    setUsers();
  }, []);

  async function handleChangePasswordClick() {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: state.currentPassword,
          newPassword: state.newPassword,
        }),
      });
      if (response.status !== 200) throw new Error();
      setState(defaultState);
      setUser(undefined);
      successToast('Password changed.', toast);
    } catch (e) {
      setState(defaultState);
      errorToast('Password could not be changed.', toast);
    }
  }

  async function handleExportBackupClick() {
    try {
      const response = await fetch('/api/user/exportBackup');
      if (response.status !== 200) throw new Error();
      const blob = await response.blob();

      let url = window.URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.href = url;
      a.download = 'yaade-db.mv.db';
      a.click();
    } catch (e) {
      errorToast('Data could not be exported.', toast);
    }
  }

  async function handleSettingChanged(key: string, value: number | boolean | string) {
    try {
      const response = await fetch('/api/user/changeSetting', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value,
        }),
      });
      if (response.status !== 200) throw new Error();
      setUser({
        ...user!,
        data: {
          ...user?.data,
          settings: {
            ...user?.data.settings,
            [key]: value,
          },
        },
      });
      successToast('Settings saved.', toast);
    } catch (e) {
      errorToast('Setting could not be changed.', toast);
    }
  }

  async function handleImportBackupClick() {
    try {
      const data = new FormData();
      data.append('File', state.backupfile, 'yaade-db.mv.db');

      const response = await fetch('/api/user/importBackup', {
        method: 'POST',
        body: data,
      });
      if (response.status !== 200) throw new Error();
      setUser(undefined);
    } catch (e) {
      errorToast('Failed to import backup', toast);
    }
  }

  async function handleLogoutClick() {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
      });
      if (response.status !== 200) throw new Error();
      setUser(undefined);
    } catch (e) {
      errorToast('Failed to logout', toast);
    }
  }

  function setAdminEditUser(i: number) {
    const editUser = adminState.users[i];
    const groupsStr = groupsArrayToStr(editUser.data?.groups);
    setAdminState({
      ...adminState,
      userRowEditIdx: i,
      userRowEditGroups: groupsStr,
    });
  }

  async function saveAdminEditUser() {
    try {
      if (adminState.userRowEditIdx === -1) return;

      const editUser = adminState.users[adminState.userRowEditIdx];
      editUser.data.groups = groupsStrToArray(adminState.userRowEditGroups);

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

      const newUsers = adminState.users;
      newUsers[adminState.userRowEditIdx] = editUser;

      setAdminState({
        ...adminState,
        users: newUsers,
        userRowEditIdx: -1,
      });
    } catch (e) {
      errorToast('Failed to save', toast);
      setAdminState({
        ...adminState,
        userRowEditIdx: -1,
      });
    }
  }

  async function addNewUser() {
    try {
      const newUser = {
        username: adminState.userAddUsername,
        groups: adminState.userAddGroups.split(','),
      };
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

        setAdminState({
          ...adminState,
          userAddUsername: '',
          userAddGroups: '',
          users: newUsers,
        });
      } else if (res.status === 409) {
        errorToast('User already exists', toast);
      } else {
        throw new Error('Could not create user');
      }
    } catch (e) {
      errorToast('User could not be created', toast);
    }
  }

  async function deleteUser() {
    try {
      const userId = adminState.deleteUser?.id;
      if (!userId) throw new Error('User id has to be set');

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (res.status === 200) {
        successToast('User deleted', toast);

        const usersRes = await fetch('/api/users');
        const newUsers = (await usersRes.json()) as Array<User>;

        setAdminState({
          ...adminState,
          deleteUser: undefined,
          users: newUsers,
        });
        onClose();
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (e) {
      errorToast('Could not delete user', toast);
    }
  }

  const selected = {
    bg: colorMode === 'light' ? 'gray.200' : 'gray.800',
    borderLeft: '4px solid var(--chakra-colors-green-500)',
    boxSizing: 'border-box',
  };

  return (
    <div className={styles.container}>
      <Tabs colorScheme="green" orientation="vertical" size="lg" tabIndex={-1}>
        <div className={styles.tabListWrapper}>
          <TabList className={styles.tabs} sx={{ borderLeft: '0px' }} tabIndex={-1}>
            <Tab sx={sx} _selected={selected} tabIndex={-1}>
              General
            </Tab>
            <Tab sx={sx} _selected={selected}>
              Account
            </Tab>
            {isAdmin() ? (
              <>
                <Divider my="4" />
                <Tab sx={sx} _selected={selected}>
                  Backup
                </Tab>
                <Tab sx={sx} _selected={selected}>
                  Users
                </Tab>
                <Divider my="4" />
              </>
            ) : null}
            <Tab sx={sx} _selected={selected}>
              About
            </Tab>
          </TabList>
        </div>

        <TabPanels tabIndex={-1}>
          <TabPanel tabIndex={-1}>
            <SettingsTab name="General">
              <Heading as="h4" size="md" mb="2">
                Theme ({colorMode})
              </Heading>
              <Stack direction="row" alignItems="center">
                <IconButton
                  aria-label="add-collection-button"
                  icon={<SunIcon />}
                  onClick={() => setColorMode('light')}
                  variant="ghost"
                  color={colorMode === 'light' ? 'green' : 'gray'}
                />
                <IconButton
                  aria-label="add-collection-button"
                  icon={<MoonIcon />}
                  onClick={() => setColorMode('dark')}
                  variant="ghost"
                  colorScheme={colorMode === 'dark' ? 'green' : 'gray'}
                />
              </Stack>
              <Heading as="h4" size="md" mb="4" mt="4">
                Behavior
              </Heading>
              <HStack mb="2">
                <Text w="200px">Save after successful send</Text>
                <Switch
                  colorScheme="green"
                  size="md"
                  onChange={(e) => handleSettingChanged('saveOnSend', e.target.checked)}
                  isChecked={user?.data.settings.saveOnSend}
                >
                  {user?.data.settings.saveOnSend ? 'ON' : 'OFF'}
                </Switch>
              </HStack>
              <HStack>
                <Text w="200px">Save on close</Text>
                <Switch
                  colorScheme="green"
                  size="md"
                  onChange={(e) => handleSettingChanged('saveOnClose', e.target.checked)}
                  isChecked={user?.data.settings.saveOnClose}
                >
                  {user?.data.settings.saveOnClose ? 'ON' : 'OFF'}
                </Switch>
              </HStack>
            </SettingsTab>
          </TabPanel>
          <TabPanel>
            <SettingsTab name="Account">
              <Heading as="h4" size="md" mb="4">
                User
              </Heading>
              <Stack direction="row" alignItems="center" mb="4">
                <p>Logged in as</p>
                <span style={{ fontWeight: 700 }}>{user?.username}</span>
                <Button
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  borderRadius={20}
                  onClick={handleLogoutClick}
                >
                  Logout
                </Button>
              </Stack>
              <Heading as="h4" size="md" mb="4">
                Password
              </Heading>
              <form>
                <input
                  className={cn(styles, 'input', [colorMode])}
                  id="current-password-input"
                  type="password"
                  placeholder="Current Password..."
                  value={state.currentPassword}
                  onChange={(e) =>
                    setState({ ...state, currentPassword: e.target.value })
                  }
                />
                <input
                  className={cn(styles, 'input', [colorMode])}
                  id="new-password-input"
                  type="password"
                  placeholder="New Password..."
                  value={state.newPassword}
                  onChange={(e) => setState({ ...state, newPassword: e.target.value })}
                />
                <input
                  className={cn(styles, 'input', [colorMode])}
                  id="repeat-password-input"
                  type="password"
                  placeholder="Repeat Password..."
                  value={state.repeatPassword}
                  onChange={(e) => setState({ ...state, repeatPassword: e.target.value })}
                />
                <Button
                  mt="4"
                  borderRadius={20}
                  colorScheme="green"
                  disabled={
                    !state.currentPassword ||
                    !state.newPassword ||
                    !(state.repeatPassword === state.newPassword)
                  }
                  onClick={handleChangePasswordClick}
                >
                  Change password
                </Button>
              </form>
            </SettingsTab>
          </TabPanel>
          {isAdmin() ? (
            <TabPanel>
              <SettingsTab name="Admin">
                <Heading as="h4" size="md" mb="2" mt="2">
                  Export Backup
                </Heading>
                <Text>
                  Export your entire Yaade data into a single file that can be used to
                  restore your data.
                </Text>
                <Button
                  mt="4"
                  borderRadius={20}
                  colorScheme="green"
                  w={150}
                  onClick={handleExportBackupClick}
                >
                  Export
                </Button>
                <Heading as="h4" size="md" mb="2" mt="4">
                  Import Backup
                </Heading>
                <Text>
                  Import a backup file. Make sure to backup your data before importing or
                  else data could be lost.
                </Text>
                <input
                  className={cn(styles, 'fileInput', [colorMode])}
                  type="file"
                  accept=".db"
                  onChange={(e) => {
                    const backupfile = e.target.files ? e.target.files[0] : undefined;
                    setState({ ...state, backupfile });
                  }}
                />
                <Checkbox
                  mt="4"
                  colorScheme="green"
                  onChange={(e) => setState({ ...state, acknowledge: e.target.checked })}
                >
                  <Text fontSize={12}>
                    I acknowledge that importing a backup file will result in a complete
                    loss of my current data with no way of recovery.
                  </Text>
                </Checkbox>
                <Button
                  mt="4"
                  borderRadius={20}
                  colorScheme="green"
                  disabled={!state.backupfile || !state.acknowledge}
                  w={150}
                  onClick={handleImportBackupClick}
                >
                  Import
                </Button>
              </SettingsTab>
            </TabPanel>
          ) : null}
          {isAdmin() ? (
            <TabPanel>
              <SettingsTab name="Users">
                <Heading as="h4" size="md" mb="2" mt="2">
                  Add new user
                </Heading>
                <HStack mb="4">
                  <Input
                    size="sm"
                    placeholder="Username"
                    width="140px"
                    value={adminState.userAddUsername}
                    onChange={(e) =>
                      setAdminState({ ...adminState, userAddUsername: e.target.value })
                    }
                  />
                  <Input
                    size="sm"
                    placeholder="Groups (Comma separated)"
                    width="300px"
                    value={adminState.userAddGroups}
                    onChange={(e) =>
                      setAdminState({ ...adminState, userAddGroups: e.target.value })
                    }
                  />
                  <div>
                    <IconButton
                      aria-label="add-new-user"
                      isRound
                      variant="ghost"
                      disabled={
                        adminState.userAddUsername === '' ||
                        adminState.userAddGroups === ''
                      }
                      onClick={addNewUser}
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
                      {adminState.users.map((u, i) => {
                        return adminState.userRowEditIdx === i ? (
                          <Tr key={`admin-user-list-${i}`}>
                            <Td p="0">{u.username}</Td>
                            <Td p="0">
                              <Input
                                size="sm"
                                variant="outline"
                                placeholder="Groups"
                                value={adminState.userRowEditGroups}
                                onChange={(e) =>
                                  setAdminState({
                                    ...adminState,
                                    userRowEditGroups: e.target.value,
                                  })
                                }
                              />
                            </Td>
                            <Td p="0">
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
                                  onClick={saveAdminEditUser}
                                  colorScheme="green"
                                  icon={<CheckIcon />}
                                />
                                <IconButton
                                  aria-label="cancel-user-edit"
                                  isRound
                                  variant="ghost"
                                  onClick={() =>
                                    setAdminState({ ...adminState, userRowEditIdx: -1 })
                                  }
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
                            >
                              {u.username}
                            </Td>
                            <Td p="0" overflowX="hidden">
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
                            <Td p="0" isNumeric>
                              <IconButton
                                aria-label="edit-row"
                                isRound
                                variant="ghost"
                                onClick={() => setAdminEditUser(i)}
                                icon={<EditIcon />}
                              />
                              <IconButton
                                aria-label="delete-row"
                                isRound
                                variant="ghost"
                                onClick={() => {
                                  setAdminState({
                                    ...adminState,
                                    deleteUser: u,
                                  });
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
              </SettingsTab>
            </TabPanel>
          ) : null}
          <TabPanel>
            <SettingsTab name="About">
              From Munich with ❤️
              <br />
              <br />
              Created by Jonathan Rösner at EsperoTech.
            </SettingsTab>
          </TabPanel>
        </TabPanels>
      </Tabs>
      <BasicModal
        isOpen={isOpen}
        initialRef={undefined}
        onClose={onClose}
        heading={`Delete "${adminState.deleteUser?.username}"`}
        onClick={deleteUser}
        buttonText="Delete"
        buttonColor="red"
        isButtonDisabled={false}
      >
        Are you sure you want to delete this user?
      </BasicModal>
    </div>
  );
}

export default Settings;
