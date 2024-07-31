import { CopyIcon, QuestionIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Divider,
  IconButton,
  Input,
  Select,
  Text,
  Tooltip,
  useClipboard,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import api from '../../api';
import { AuthData } from '../../model/Request';
import { errorToast, parseLocation, successToast } from '../../utils';
import interpolate from '../../utils/interpolate';
import SingleRowEditor from '../SingleRowEditor';
import styles from './AuthTab.module.css';

const DEFAULT_AUTH_DATA: AuthData = {
  type: 'basic',
  enabled: false,
};

type AuthTabProps = {
  authData?: AuthData;
  setAuthData: (authData: AuthData) => void;
  doSave: (preventSuccessToast?: boolean) => Promise<void>;
  selectedEnv: any;
};

export default function AuthTab({
  authData,
  setAuthData,
  doSave,
  selectedEnv,
}: AuthTabProps) {
  const toast = useToast();
  const location = useLocation();
  useEffect(() => {
    if (!authData) {
      setAuthData(DEFAULT_AUTH_DATA);
    }
  }, [authData, setAuthData]);
  const { onCopy } = useClipboard(authData?.oauth2?.accessToken || '');

  const generateToken = useCallback(async () => {
    if (!authData) {
      errorToast('Auth data is missing.', toast);
      return;
    }

    if (authData.type !== 'oauth2' || !authData.oauth2) {
      errorToast('OAuth2 data is missing.', toast);
      return;
    }

    // we need to save the request so that upon redirect we don't loose the data
    await doSave(true);

    const interpolatedAuthData = interpolate(authData, selectedEnv?.data ?? {});
    if (interpolatedAuthData.errors.length > 0) {
      errorToast('Failed to interpolate auth data.', toast);
    }

    const {
      grantType,
      authUrl,
      tokenUrl,
      clientId,
      clientSecret,
      scope,
      username,
      password,
    } = interpolatedAuthData.result.oauth2;

    const loc = parseLocation(location);
    const url = new URL(window.location.href);
    let redirectUri = `${url.protocol}//${url.host}`;

    if (loc.collectionId) {
      redirectUri += `/#/${loc.collectionId}`;
    }

    if (loc.requestId) {
      redirectUri += `/${loc.requestId}`;
    }

    switch (grantType ?? 'authorization_code') {
      case 'authorization_code':
        if (!authUrl) {
          errorToast('Auth URL is missing for authCode grant type.', toast);
          return;
        }
        var newUri = `${authUrl}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
          redirectUri,
        )}`;
        if (scope) {
          newUri += `&scope=${encodeURIComponent(scope)}`;
        }
        window.location.href = newUri;
        break;

      case 'client_credentials':
        if (!tokenUrl || !clientSecret || !clientId) {
          errorToast(
            'Token URL or client secret is missing for clientCredentials grant type.',
            toast,
          );
          return;
        }

        try {
          const clientCredentialsBody = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId || '',
            client_secret: clientSecret || '',
          });
          if (scope) {
            clientCredentialsBody.append('scope', scope);
          }
          const res = await api.exchangeOAuthToken(
            tokenUrl,
            clientCredentialsBody.toString(),
          );
          if (!res.ok) {
            throw new Error('Failed to exchange code for token');
          }
          const body: any = await res.json();

          setAuthData({
            ...authData,
            oauth2: {
              ...authData.oauth2,
              accessToken: body.access_token,
              refreshToken: body.refresh_token,
              scope: body.scope,
            },
          });
          successToast('Token was successfully generated.', toast);
        } catch (e) {
          errorToast('Failed to fetch token: ' + e, toast);
        }
        break;

      case 'password':
        if (!tokenUrl || !clientId || !username || !password) {
          errorToast('Data is missing.', toast);
          return;
        }

        try {
          const clientCredentialsBody = new URLSearchParams({
            grant_type: 'password',
            client_id: clientId || '',
            username: username || '',
            password: password || '',
          });
          if (clientSecret) {
            clientCredentialsBody.append('client_secret', clientSecret);
          }
          if (scope) {
            clientCredentialsBody.append('scope', scope);
          }
          const res = await api.exchangeOAuthToken(
            tokenUrl,
            clientCredentialsBody.toString(),
          );
          if (!res.ok) {
            throw new Error('Failed to exchange code for token');
          }
          const body: any = await res.json();

          setAuthData({
            ...authData,
            oauth2: {
              ...authData.oauth2,
              accessToken: body.access_token,
              refreshToken: body.refresh_token,
              scope: body.scope,
            },
          });
          successToast('Token was successfully generated.', toast);
        } catch (e) {
          errorToast('Failed to fetch token: ' + e, toast);
        }
        break;

      case 'implicit':
        console.log('implicit grant type is not supported in this example.');
        break;

      default:
        console.log('Unsupported grant type.');
        break;
    }
  }, [authData, doSave, location, selectedEnv, setAuthData, toast]);

  const patch = useCallback(
    (data: AuthData) => {
      setAuthData({
        ...authData,
        ...data,
      });
    },
    [authData, setAuthData],
  );

  const settings = useMemo(() => {
    const patchBasic = (data: AuthData['basic']) => {
      patch({ basic: { ...authData?.basic, ...data } });
    };

    const patchOAuth2 = (data: AuthData['oauth2']) => {
      patch({ oauth2: { ...authData?.oauth2, ...data } });
    };
    let grantTypeSettings = null;

    switch (authData?.type) {
      case 'basic':
        return (
          <>
            <div className={styles.grid}>
              <Text fontSize="sm">Username</Text>
              <SingleRowEditor
                value={authData?.basic?.username || ''}
                onChange={(e) => patchBasic({ username: e })}
                placeholder="username"
                selectedEnv={selectedEnv}
              />
              <Text fontSize="sm">Password</Text>
              <SingleRowEditor
                value={authData?.basic?.password || ''}
                onChange={(e) => patchBasic({ password: e })}
                placeholder="password"
                selectedEnv={selectedEnv}
              />
            </div>
          </>
        );
      case 'oauth2':
        switch (authData?.oauth2?.grantType || 'authorization_code') {
          case 'authorization_code':
            grantTypeSettings = (
              <>
                <Text fontSize="sm">Auth URL</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.authUrl || ''}
                  onChange={(e) => patchOAuth2({ authUrl: e })}
                  placeholder="https://example.com/oauth2/auth"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Token URL</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.tokenUrl || ''}
                  onChange={(e) => patchOAuth2({ tokenUrl: e })}
                  placeholder="https://example.com/oauth2/token"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Client ID</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.clientId || ''}
                  onChange={(e) => patchOAuth2({ clientId: e })}
                  placeholder="client-id"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Client Secret</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.clientSecret || ''}
                  onChange={(e) => patchOAuth2({ clientSecret: e })}
                  placeholder="client-secret"
                  selectedEnv={selectedEnv}
                />
              </>
            );
            break;
          case 'client_credentials':
            grantTypeSettings = (
              <>
                <Text fontSize="sm">Token URL</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.tokenUrl || ''}
                  onChange={(e) => patchOAuth2({ tokenUrl: e })}
                  placeholder="https://example.com/oauth2/token"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Client ID</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.clientId || ''}
                  onChange={(e) => patchOAuth2({ clientId: e })}
                  placeholder="client-id"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Client Secret</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.clientSecret || ''}
                  onChange={(e) => patchOAuth2({ clientSecret: e })}
                  placeholder="client-secret"
                  selectedEnv={selectedEnv}
                />
              </>
            );
            break;
          case 'password':
            grantTypeSettings = (
              <>
                <Text fontSize="sm">Token URL</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.tokenUrl || ''}
                  onChange={(e) => patchOAuth2({ tokenUrl: e })}
                  placeholder="https://example.com/oauth2/token"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Client ID</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.clientId || ''}
                  onChange={(e) => patchOAuth2({ clientId: e })}
                  placeholder="client-id"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Client Secret</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.clientSecret || ''}
                  onChange={(e) => patchOAuth2({ clientSecret: e })}
                  placeholder="client-secret"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Username</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.username || ''}
                  onChange={(e) => patchOAuth2({ username: e })}
                  placeholder="username"
                  selectedEnv={selectedEnv}
                />
                <Text fontSize="sm">Password</Text>
                <SingleRowEditor
                  value={authData?.oauth2?.password || ''}
                  onChange={(e) => patchOAuth2({ password: e })}
                  placeholder="password"
                  selectedEnv={selectedEnv}
                />
              </>
            );
            break;
          default:
            grantTypeSettings = null;
        }
        return (
          <>
            <div className={styles.grid}>
              {authData?.oauth2?.accessToken && (
                <>
                  <Text fontSize="sm">Current Token</Text>
                  <div style={{ display: 'flex' }}>
                    <Input
                      value={authData?.oauth2?.accessToken || ''}
                      disabled={true}
                      borderRadius={20}
                    />
                    <IconButton
                      aria-label="beautify-content"
                      isRound
                      variant="ghost"
                      onClick={() => {
                        onCopy();
                        successToast('Copied to clipboard', toast);
                      }}
                      icon={<CopyIcon />}
                    />
                  </div>
                </>
              )}
              <Text fontSize="sm">Grant Type</Text>
              <Select
                borderRadius={20}
                outline="none"
                value={authData?.oauth2?.grantType || 'authCode'}
                onChange={(e) =>
                  patchOAuth2({
                    grantType: e.target.value as
                      | 'authorization_code'
                      | 'client_credentials'
                      | 'password'
                      | 'implicit',
                  })
                }
              >
                <option value="authorization_code">Authorization Code</option>
                <option value="client_credentials">Client Credentials</option>
                <option value="password">Password</option>
                {/* <option value="implicit">Implicit</option> */}
              </Select>
              {grantTypeSettings}
              <Text fontSize="sm">Scope</Text>
              <SingleRowEditor
                value={authData?.oauth2?.scope || ''}
                onChange={(e) => patchOAuth2({ scope: e })}
                placeholder="read:all"
                selectedEnv={selectedEnv}
              />
            </div>
            <Button
              mt={3}
              mb={10}
              borderRadius={20}
              colorScheme="green"
              onClick={generateToken}
              disabled={!authData}
            >
              Generate Token
            </Button>
          </>
        );
      default:
        return null;
    }
  }, [authData, generateToken, onCopy, patch, selectedEnv, toast]);

  const tooltip = useMemo(() => {
    switch (authData?.type) {
      case 'basic':
        return 'When enabled, the request will be sent with an additional "Authorization: Basic <credentials>" header.';
      case 'oauth2':
        return 'When enabled, the request will be sent with an additional "Authorization: Bearer <token>" header. Note that the token needs to be generated first, by pushing the "Generate Token" button.';
      default:
        return '';
    }
  }, [authData?.type]);

  return (
    <>
      <div className={styles.menu}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Text fontSize="sm" w="100px">
            Type
          </Text>
          <Select
            size="xs"
            outline="none"
            value={authData?.type || 'basic'}
            onChange={(e) => patch({ type: e.target.value as 'basic' | 'oauth2' })}
          >
            <option value="basic">Basic</option>
            <option value="oauth2">OAuth 2.0</option>
          </Select>
          <Tooltip label={tooltip} fontSize="md">
            <QuestionOutlineIcon />
          </Tooltip>
        </div>

        <div className={styles.iconBar}>
          <Checkbox
            colorScheme="green"
            onChange={(e) => patch({ enabled: e.target.checked })}
            isChecked={!!authData?.enabled}
          >
            Enabled
          </Checkbox>
        </div>
      </div>

      <Divider />
      {settings}
    </>
  );
}
