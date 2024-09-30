import { CopyIcon, DeleteIcon } from '@chakra-ui/icons';
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
  Text,
  Th,
  Thead,
  Tr,
  useClipboard,
  useColorMode,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { FunctionComponent, useEffect, useState } from 'react';

import AccessToken from '../../../model/AccessToken';
import { BASE_PATH, cn, errorToast, successToast } from '../../../utils';
import SettingsTab from '../settingsTab';

type AccessTokenSettingsState = {
  accessTokens: AccessToken[];
  newlyCreatedAccessToken?: AccessToken;
};

type CreateNewAccessTokenState = {
  name: string;
};

const defaultCreateAccessToken: CreateNewAccessTokenState = {
  name: '',
};

const AccessTokenSettings: FunctionComponent = () => {
  const [state, setState] = useState<AccessTokenSettingsState>({
    accessTokens: [],
  });
  const [newTokenState, setNewTokenState] = useState<CreateNewAccessTokenState>(
    defaultCreateAccessToken,
  );

  const { colorMode } = useColorMode();
  const toast = useToast();
  const { onCopy } = useClipboard(state.newlyCreatedAccessToken?.secret || '');

  useEffect(() => {
    const getAccessTokens = async () => {
      try {
        const res = await fetch(BASE_PATH + 'api/accessTokens');
        const resObject = await res.json();
        const accessTokens = resObject as Array<AccessToken>;

        setState((s) => {
          return { ...s, accessTokens };
        });
      } catch (e) {
        errorToast('Access Token could not be fetched.', toast);
      }
    };
    getAccessTokens();
  }, [toast]);

  async function handleAddAccessTokenClick() {
    try {
      const res = await fetch(BASE_PATH + 'api/accessTokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTokenState.name,
          createdAt: new Date().getTime(),
        }),
      });

      if (res.status === 200) {
        const newToken = (await res.json()) as AccessToken;

        setState({ ...state, newlyCreatedAccessToken: newToken });
        setNewTokenState(defaultCreateAccessToken);
        successToast('Access Token created', toast);
      } else if (res.status === 409) {
        errorToast('Access Token already exists', toast);
      } else {
        throw new Error();
      }
    } catch (e) {
      errorToast('Access Token could not be created', toast);
    }
  }

  async function handleDeleteAccessTokenClick(id: number) {
    try {
      await fetch(BASE_PATH + 'api/accessTokens/' + id, {
        method: 'DELETE',
      });

      setState((s) => {
        return {
          ...s,
          accessTokens: s.accessTokens.filter((c) => c.id !== id),
        };
      });

      successToast('Access Token deleted', toast);
    } catch (e) {
      errorToast('Access Token could not be deleted.', toast);
    }
  }

  function validateForm(): boolean {
    return (
      newTokenState.name !== '' &&
      newTokenState.name.length > 3 &&
      newTokenState.name.length < 50
    );
  }

  return (
    <SettingsTab name="Access Tokens">
      <Text mb="4">
        Generate an access token that can be used to authenticate against the API.
      </Text>
      <TableContainer maxHeight="160px" overflowY="scroll">
        <Table size="sm" whiteSpace="normal">
          <Thead>
            <Tr>
              <Th p="0" width="300px" maxWidth="350px">
                Name
              </Th>
              <Th p="0" width="240px" maxWidth="240px">
                Created At
              </Th>
              <Th width="110px" maxWidth="110px" isNumeric></Th>
            </Tr>
          </Thead>
          <Tbody>
            {state.accessTokens?.length == 0 ? (
              <div style={{ marginTop: '5px' }}>
                <span> No Access Tokens...</span>
              </div>
            ) : (
              state.accessTokens?.map((u, i) => {
                return (
                  <Tr key={`accessToken-list-${i}`}>
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
                      {u.data.name}
                    </Td>
                    <Td p="0" overflowX="hidden" verticalAlign="top" padding="8px 0 0 0">
                      {new Date(u.data.createdAt ?? 0).toDateString()}
                    </Td>
                    <Td p="0" isNumeric verticalAlign="top">
                      <IconButton
                        aria-label="delete-row"
                        isRound
                        variant="ghost"
                        onClick={() => handleDeleteAccessTokenClick(u.id)}
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
          Create a new Access Token
        </Heading>
        <Input
          size="sm"
          placeholder="Name"
          mb="2"
          backgroundColor={colorMode === 'light' ? 'white' : undefined}
          value={newTokenState.name}
          onChange={(e) => setNewTokenState({ ...newTokenState, name: e.target.value })}
        />

        <Button
          mt="4"
          borderRadius={20}
          colorScheme="green"
          w={150}
          onClick={handleAddAccessTokenClick}
          disabled={!validateForm()}
        >
          Add
        </Button>
      </div>
      {state.newlyCreatedAccessToken && (
        <div style={{ marginTop: '30px' }}>
          <Heading as="h5" size="md" mb="2" mt="4">
            Your new Access Token
          </Heading>
          <HStack>
            <Input
              disabled={true}
              value={state.newlyCreatedAccessToken.secret ?? ''}
            ></Input>
            <IconButton
              aria-label="copy-token"
              icon={<CopyIcon />}
              onClick={() => {
                onCopy();
                successToast('Token copied to clipboard', toast);
              }}
            />
          </HStack>
          <Text as="cite">
            Save your access token! You are not able to access it again.
          </Text>
        </div>
      )}
    </SettingsTab>
  );
};

export default AccessTokenSettings;
