import {
  AddIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  DeleteIcon,
  NotAllowedIcon,
} from '@chakra-ui/icons';
import {
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import KVRow from '../../../model/KVRow';
import { BASE_PATH, errorToast, kvRowsToMap, successToast } from '../../../utils';
import { getSelectedEnvs, saveSelectedEnv } from '../../../utils/store';
import KVEditor from '../../kvEditor';
import styles from './EnvironmentsTab.module.css';

type Environment = {
  data: Record<string, string>;
  proxy: string;
  secretKeys: string[];
};

type EnvironmentModalProps = {
  collectionId: number;
  envs: Record<string, Environment>;
  setEnvs: (envs: Record<string, Environment>) => void;
};

type Secret = {
  key: string;
  value: string;
  isChanged: boolean;
};

type EnvironmentTabState = {
  modalState: 'create' | 'copy' | 'default';
  newEnvName: string;
  envNameToCopy?: string;
  // we need duplicate state here because leaving variables as
  // a map would lead to weird input behavior on duplicate keys
  selectedEnvKVs?: KVRow[];
  selectedEnvSecrets: Secret[];
  newSecretKey: string;
  newSecretValue: string;
};

const DEFAULT_ENV = {
  data: {},
  proxy: 'ext',
  secretKeys: [],
};

const DEFAULT_SECRET_VALUE = '*******';

const EnvironmentTab: FunctionComponent<EnvironmentModalProps> = ({
  collectionId,
  envs,
  setEnvs,
}) => {
  const [state, setState] = useState<EnvironmentTabState>({
    modalState: 'default',
    newEnvName: '',
    newSecretKey: '',
    newSecretValue: '',
    selectedEnvKVs: [],
    selectedEnvSecrets: [],
  });
  const [selectedEnvName, setSelectedEnvName] = useState<string>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const envsRef = useRef(envs);
  const envNames = Object.keys(envs ?? {});
  const [localSelectedEnvs, setLocalSelectedEnvs] = useState(getSelectedEnvs());

  useEffect(() => {
    envsRef.current = envs;
  }, [envs]);

  const getEnvOrDefault = (name?: string): Environment => {
    if (!name) return DEFAULT_ENV;
    return envsRef.current[name] ?? DEFAULT_ENV;
  };

  const envSelected = useCallback(
    (name: string) => {
      const selectedEnv = getEnvOrDefault(name);
      const secretsKeys = selectedEnv?.secretKeys ?? [];
      const selectedEnvKVs = mapEnvDataToKVRows(selectedEnv.data ?? {});
      const selectedEnvSecrets: Secret[] = secretsKeys.map((key: any) => {
        return {
          key,
          value: DEFAULT_SECRET_VALUE,
          isChanged: false,
        };
      });
      setState((state) => {
        return {
          ...state,
          selectedEnvKVs,
          selectedEnvSecrets,
        };
      });
      saveSelectedEnv(collectionId, name);
    },
    [collectionId],
  );

  useEffect(() => {
    const selectedEnvName = getSelectedEnvs()[collectionId];
    if (selectedEnvName) {
      setSelectedEnvName(selectedEnvName);
    } else {
      let defaultEnvName = envNames.find((el) => el === localSelectedEnvs[collectionId]);
      if (!defaultEnvName && envNames.length !== 0) {
        defaultEnvName = envNames[0];
      }
      if (defaultEnvName) {
        envSelected(defaultEnvName);
      }
    }
  }, [collectionId, envNames, envSelected, envsRef, localSelectedEnvs]);

  useEffect(() => {
    if (!selectedEnvName) return;
    const selectedEnv = envsRef.current[selectedEnvName];
    const secrets = selectedEnv?.secretKeys ?? [];
    if (!selectedEnv) return;
    setState((state) => {
      return {
        ...state,
        selectedEnvName: getSelectedEnvs()[collectionId],
        selectedEnvKVs: mapEnvDataToKVRows(selectedEnv.data),
        selectedEnvSecrets: secrets.map((key: any) => {
          return {
            key,
            value: DEFAULT_SECRET_VALUE,
            isChanged: false,
          };
        }),
      };
    });
  }, [collectionId, selectedEnvName]);

  useEffect(() => {
    if (['create', 'copy'].includes(state.modalState)) {
      inputRef.current?.focus();
    }
  }, [state.modalState]);

  function mapEnvDataToKVRows(data: Record<string, string>): KVRow[] {
    if (Object.keys(data).length === 0) {
      return [{ key: '', value: '' }];
    }
    return Object.entries(data).map(([key, value]) => ({
      key,
      value: value as string,
    }));
  }

  async function handleCreateEnvClicked() {
    // TODO: created envs need to be directly written to global state
    try {
      let options: any = {
        method: 'POST',
      };
      const envToCopy = getEnvOrDefault(state.envNameToCopy) ?? {};
      const copiedData = JSON.parse(JSON.stringify(envToCopy.data ?? {}));
      const proxy = envToCopy.proxy;

      if (state.modalState === 'copy') {
        const body = { data: copiedData, proxy };
        options.body = JSON.stringify(body);
      }

      const res = await fetch(
        BASE_PATH + `api/collection/${collectionId}/envs/${state.newEnvName}`,
        options,
      );
      if (res.status !== 200) throw Error();

      const data = state.modalState === 'copy' ? copiedData : {};

      setEnvs({
        ...envs,
        [state.newEnvName]: {
          data,
          proxy,
          secretKeys: [],
        },
      });
      saveSelectedEnv(collectionId, state.newEnvName);
      setState({
        ...state,
        newEnvName: '',
        modalState: 'default',
        selectedEnvSecrets: [],
        envNameToCopy: undefined,
      });
      setSelectedEnvName(state.newEnvName);
      setLocalSelectedEnvs({ ...localSelectedEnvs, [collectionId]: state.newEnvName });
      successToast('Environment created.', toast);
    } catch (e) {
      errorToast('Could not create environment', toast);
    }
  }

  async function handleDeleteEnvClicked() {
    try {
      if (!selectedEnvName || envNames.length <= 1) throw Error();
      const res = await fetch(
        BASE_PATH + `api/collection/${collectionId}/envs/${selectedEnvName}`,
        {
          method: 'DELETE',
        },
      );
      if (res.status !== 200) throw Error();

      const newEnvs = envs ?? {};
      delete newEnvs[selectedEnvName];

      setEnvs(newEnvs);
      setState({
        ...state,
        newEnvName: '',
        modalState: 'default',
        selectedEnvSecrets: [],
        envNameToCopy: undefined,
      });
      setSelectedEnvName(undefined);
      successToast('Environment deleted.', toast);
    } catch (e) {
      errorToast('Could not delete environment', toast);
    }
  }

  function setSelectedEnvData(selectedEnvData: KVRow[]) {
    if (!selectedEnvName) return;
    setState({
      ...state,
      selectedEnvKVs: selectedEnvData,
    });
    const data = kvRowsToMap(selectedEnvData);
    const selectedEnv = getEnvOrDefault(selectedEnvName);
    setEnvs({
      ...envs,
      [selectedEnvName]: {
        ...selectedEnv,
        data,
      },
    });
  }

  function setProxy(proxy: string) {
    if (!selectedEnvName) return;
    const selectedEnv = getEnvOrDefault(selectedEnvName);
    setEnvs({
      ...envs,
      [selectedEnvName]: {
        ...selectedEnv,
        proxy,
      },
    });
  }

  function isCreateDisabled() {
    return (
      state.newEnvName === '' ||
      envNames.includes(state.newEnvName) ||
      state.newEnvName.includes('__') ||
      state.newEnvName.includes(' ')
    );
  }

  async function handleCreateSecretClicked() {
    try {
      const res = await fetch(
        BASE_PATH +
          `api/collection/${collectionId}/envs/${selectedEnvName}/secrets/${state.newSecretKey}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: state.newSecretValue,
          }),
        },
      );
      if (res.status !== 200) throw Error();
      addSecret(state.newSecretKey);
      successToast('Secret created', toast);
    } catch (e) {
      errorToast('Failed to create secret', toast);
    }
  }

  function handleClearSecretClicked() {
    setState({ ...state, newSecretKey: '', newSecretValue: '' });
  }

  async function handleSaveSecretClicked(i: number) {
    try {
      if (!state.selectedEnvSecrets) return;
      const secret = { ...state.selectedEnvSecrets[i] };
      const res = await fetch(
        BASE_PATH +
          `api/collection/${collectionId}/envs/${selectedEnvName}/secrets/${secret.key}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            value: secret.value,
          }),
        },
      );
      if (res.status !== 200) throw Error();

      secret.value = DEFAULT_SECRET_VALUE;
      secret.isChanged = false;
      setSecret(i, secret);
      successToast('Secret saved', toast);
    } catch (e) {
      errorToast('Failed to set secret', toast);
    }
  }

  async function handleDeleteSecretClicked(i: number) {
    try {
      if (!state.selectedEnvSecrets) return;
      const secret = { ...state.selectedEnvSecrets[i] };
      const res = await fetch(
        BASE_PATH +
          `api/collection/${collectionId}/envs/${selectedEnvName}/secrets/${secret.key}`,
        {
          method: 'DELETE',
        },
      );
      if (res.status !== 200) throw Error();

      deleteSecret(i);
      successToast('Secret deleted', toast);
    } catch (e) {
      errorToast('Failed to delete secret', toast);
    }
  }

  function addSecret(key: string) {
    if (!state.selectedEnvSecrets || !selectedEnvName) return;
    const newSecret: Secret = {
      key,
      value: DEFAULT_SECRET_VALUE,
      isChanged: false,
    };
    const selectedEnv = getEnvOrDefault(selectedEnvName);
    const newSecrets = [...state.selectedEnvSecrets, newSecret];
    const newSecretKeys = newSecrets.map((el) => el.key);
    setState({
      ...state,
      selectedEnvSecrets: newSecrets,
      newSecretKey: '',
      newSecretValue: '',
    });
    setEnvs({
      ...envs,
      [selectedEnvName]: {
        ...selectedEnv,
        secretKeys: newSecretKeys,
      },
    });
  }

  function setSecret(i: number, secret: Secret) {
    if (!state.selectedEnvSecrets) return;
    const newSecrets = [...state.selectedEnvSecrets];
    newSecrets[i] = secret;
    setState({ ...state, selectedEnvSecrets: newSecrets });
  }

  function deleteSecret(i: number) {
    if (!state.selectedEnvSecrets || !selectedEnvName) return;
    const selectedEnv = getEnvOrDefault(selectedEnvName);
    const newSecrets = [...state.selectedEnvSecrets];
    newSecrets.splice(i, 1);
    setState({ ...state, selectedEnvSecrets: newSecrets });
    const newSecretKeys = newSecrets.map((el) => el.key);
    setEnvs({
      ...envs,
      [selectedEnvName]: {
        ...selectedEnv,
        secretKeys: newSecretKeys,
      },
    });
  }

  function handleSecretClicked(i: number) {
    if (!state.selectedEnvSecrets) return;
    const secret = { ...state.selectedEnvSecrets[i] };
    secret.isChanged = true;
    secret.value = '';
    setSecret(i, secret);
  }

  function setSecretValue(i: number, value: string) {
    if (!state.selectedEnvSecrets) return;
    const secret = { ...state.selectedEnvSecrets[i] };
    secret.value = value;
    setSecret(i, secret);
  }

  function handleCancelEditSecretClicked(i: number) {
    if (!state.selectedEnvSecrets) return;
    const secret = { ...state.selectedEnvSecrets[i] };
    secret.value = DEFAULT_SECRET_VALUE;
    secret.isChanged = false;
    setSecret(i, secret);
  }

  function isAddSecretDisabled(): boolean {
    if (state.newSecretKey === '' || state.newSecretValue === '') {
      return true;
    }
    return state.selectedEnvSecrets.map((el) => el.key).includes(state.newSecretKey);
  }

  function isClearSecretDisabled(): boolean {
    return state.newSecretKey === '' && state.newSecretValue === '';
  }

  return (
    <div>
      {state.modalState === 'create' || state.modalState === 'copy' ? (
        <HStack>
          <Input
            placeholder="Name"
            w="100%"
            borderRadius={20}
            colorScheme="green"
            value={state.newEnvName}
            ref={inputRef}
            onChange={(e) => setState({ ...state, newEnvName: e.target.value })}
            onKeyDown={(e) => {
              e.key === 'Enter' && e.preventDefault();
            }}
          />
          <IconButton
            icon={<CheckIcon />}
            variant="ghost"
            colorScheme="green"
            aria-label="Create new environment"
            disabled={isCreateDisabled()}
            onClick={handleCreateEnvClicked}
          />
          <IconButton
            icon={<CloseIcon />}
            disabled={!selectedEnvName}
            variant="ghost"
            colorScheme="red"
            aria-label="Close form to create new environment"
            onClick={() => setState({ ...state, modalState: 'default', newEnvName: '' })}
          />
        </HStack>
      ) : (
        <HStack>
          <Select
            w="100%"
            borderRadius={20}
            colorScheme="green"
            onChange={(e) => envSelected(e.target.value)}
            value={selectedEnvName}
          >
            {envNames.map((env: any) => (
              <option key={`${collectionId}-${env}`}>{env}</option>
            ))}
          </Select>
          <IconButton
            icon={<AddIcon />}
            variant="ghost"
            aria-label="Open form to create new environment"
            onClick={() => setState({ ...state, modalState: 'create' })}
            marginInlineStart="0"
          />
          <IconButton
            icon={<CopyIcon />}
            variant="ghost"
            aria-label="Open form to create new environment"
            onClick={() =>
              setState({
                ...state,
                modalState: 'copy',
                envNameToCopy: selectedEnvName,
                newEnvName: `${selectedEnvName}-copy`,
              })
            }
            disabled={!selectedEnvName}
            marginInlineStart="0"
          />
          <IconButton
            icon={<DeleteIcon />}
            variant="ghost"
            colorScheme="red"
            disabled={!selectedEnvName || envNames.length <= 1}
            aria-label="Open form to create new environment"
            onClick={handleDeleteEnvClicked}
            marginInlineStart="0"
          />
        </HStack>
      )}

      {selectedEnvName ? (
        <div style={{ overflow: 'auto' }}>
          <Heading as="h6" size="xs" my="4">
            Proxy
          </Heading>
          <Select
            w="100%"
            borderRadius={20}
            colorScheme="green"
            onChange={(e) => setProxy(e.target.value)}
            value={envs[selectedEnvName]?.proxy ?? 'ext'}
          >
            <option value="ext">Extension</option>
            <option value="server">Server</option>
          </Select>
          <Heading as="h6" size="xs" my="4">
            Variables
          </Heading>
          <KVEditor
            name="env"
            kvs={state.selectedEnvKVs ?? []}
            setKvs={(kvs: KVRow[]) => setSelectedEnvData(kvs)}
            hasEnvSupport={'NONE'}
          />
          {envs[selectedEnvName]?.proxy === 'server' ? (
            <>
              <HStack>
                <Heading as="h6" size="xs" my="4">
                  Secrets
                </Heading>
              </HStack>
              <div className={styles.row} style={{ marginBottom: '1rem' }}>
                <input
                  className={`${styles.input} ${styles['input--left']} ${
                    styles[`input--${colorMode}`]
                  }`}
                  placeholder="Key"
                  value={state.newSecretKey}
                  onChange={(e) => setState({ ...state, newSecretKey: e.target.value })}
                />
                <input
                  className={`${styles.input} ${styles['input--right']} ${
                    styles[`input--${colorMode}`]
                  }`}
                  placeholder="Value"
                  value={state.newSecretValue}
                  onChange={(e) => setState({ ...state, newSecretValue: e.target.value })}
                />
                <IconButton
                  aria-label="add-secret"
                  isRound
                  variant="ghost"
                  disabled={isAddSecretDisabled()}
                  colorScheme="green"
                  icon={<CheckIcon />}
                  onClick={handleCreateSecretClicked}
                />
                <IconButton
                  aria-label="clear-secret"
                  isRound
                  variant="ghost"
                  disabled={isClearSecretDisabled()}
                  colorScheme="red"
                  icon={<NotAllowedIcon />}
                  onClick={handleClearSecretClicked}
                />
              </div>
              {state.selectedEnvSecrets.map((secret, i) => {
                return (
                  <div key={`secret-${i}`} className={styles.row}>
                    <input
                      className={`${styles.input} ${styles['input--left']} ${
                        styles[`input--${colorMode}`]
                      }`}
                      placeholder="Key"
                      value={secret.key}
                      readOnly
                    />
                    <input
                      className={`${styles.input} ${styles['input--right']} ${
                        styles[`input--${colorMode}`]
                      }`}
                      placeholder="Value"
                      value={secret.value}
                      readOnly={!secret.isChanged}
                      onClick={() => handleSecretClicked(i)}
                      onChange={(e) => setSecretValue(i, e.target.value)}
                    />
                    <IconButton
                      aria-label="edit-row"
                      disabled={!secret.isChanged || secret.value === ''}
                      isRound
                      variant="ghost"
                      colorScheme="green"
                      icon={<CheckIcon />}
                      onClick={() => handleSaveSecretClicked(i)}
                    />
                    {secret.isChanged ? (
                      <IconButton
                        aria-label="cancel-edit-row"
                        disabled={!secret.isChanged}
                        isRound
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => handleCancelEditSecretClicked(i)}
                        icon={<CloseIcon />}
                      />
                    ) : (
                      <IconButton
                        aria-label="delete-secret-row"
                        isRound
                        variant="ghost"
                        onClick={() => handleDeleteSecretClicked(i)}
                        colorScheme="red"
                        icon={<DeleteIcon />}
                      />
                    )}
                  </div>
                );
              })}
              {/* this is just some padding to prevent a hard cutoff on overflow */}
              <div style={{ minHeight: '20px' }} />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default EnvironmentTab;
