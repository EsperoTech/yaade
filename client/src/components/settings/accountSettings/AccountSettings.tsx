import {
  Button,
  Heading,
  Stack,
  Tag,
  TagLabel,
  useColorMode,
  useToast,
  Wrap,
} from '@chakra-ui/react';
import { FunctionComponent, useContext, useState } from 'react';

import { UserContext } from '../../../context';
import { cn, errorToast, successToast } from '../../../utils';
import SettingsTab from '../settingsTab';
import styles from './AccountSettings.module.css';

type AccountSettingsProps = {};

type AccountSettingsState = {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
};

const defaultState = {
  currentPassword: '',
  newPassword: '',
  repeatPassword: '',
};

const AccountSettings: FunctionComponent<AccountSettingsProps> = () => {
  const [state, setState] = useState<AccountSettingsState>(defaultState);

  const { colorMode } = useColorMode();
  const { user, setUser } = useContext(UserContext);
  const toast = useToast();

  async function handleChangePasswordClick() {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'api/user', {
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

  async function handleLogoutClick() {
    try {
      const response = await fetch(import.meta.env.BASE_URL + 'api/logout', {
        method: 'POST',
      });
      if (response.status !== 200) throw new Error();
      setUser(undefined);
    } catch (e) {
      errorToast('Failed to logout', toast);
    }
  }

  return (
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
        Groups
      </Heading>
      <Wrap mb="4">
        {user?.data?.groups?.map((group: any) => (
          <Tag
            size="sm"
            key={`collection-group-list-${group}`}
            borderRadius="full"
            variant="solid"
            colorScheme="green"
            mx="0.25rem"
            my="0.2rem"
          >
            <TagLabel>{group}</TagLabel>
          </Tag>
        ))}
      </Wrap>
      {!user?.data?.isExternal ? (
        <>
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
              onChange={(e) => setState({ ...state, currentPassword: e.target.value })}
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
        </>
      ) : null}
    </SettingsTab>
  );
};
export default AccountSettings;
