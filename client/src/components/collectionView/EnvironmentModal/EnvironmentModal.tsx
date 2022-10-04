import { AddIcon, CheckIcon, CloseIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { FunctionComponent, useEffect, useRef, useState } from 'react';

import Collection from '../../../model/Collection';
import KVRow from '../../../model/KVRow';
import { errorToast, kvRowsToMap, mapToKvRows, successToast } from '../../../utils';
import { getSelectedEnvs, saveSelectedEnv } from '../../../utils/store';
import BasicModal from '../../basicModal';
import KVEditor from '../../kvEditor';
import styles from './EnvironmentModal.module.css';

type EnvironmentModalProps = {
  collection: Collection;
  saveCollection: (c: Collection) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type Secret = {
  key: string;
  value: string;
  isChanged: boolean;
};

type EnvironmentModalState = {
  modalState: 'create' | 'copy' | 'default';
  newEnvName: string;
  envNameToCopy?: string;
  selectedEnvName?: string;
  selectedEnvData?: KVRow[];
  selectedEnvSecrets: Secret[];
  selectedEnvProxy?: string;
  newSecretKey: string;
  newSecretValue: string;
};

const DEFAULT_SECRET_VALUE = '*******';

const EnvironmentModal: FunctionComponent<EnvironmentModalProps> = ({
  collection,
  saveCollection,
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<EnvironmentModalState>({
    modalState: 'default',
    newEnvName: '',
    newSecretKey: '',
    newSecretValue: '',
    selectedEnvSecrets: [],
  });
  const { colorMode } = useColorMode();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (['create', 'copy'].includes(state.modalState)) {
      inputRef.current?.focus();
    }
  }, [state.modalState]);

  const envNames = Object.keys(collection.data?.envs ?? {});
  const selectedEnvs = getSelectedEnvs();

  function getEnvData(name?: string): KVRow[] {
    if (!name) return [];
    const env = collection.data?.envs?.[name];
    const data = Object.entries(env?.data ?? {}).map(([key, value]) => ({
      key,
      value: value as string,
    }));

    if (data.length === 0) {
      return [{ key: '', value: '' }];
    }

    return data;
  }

  function getEnv(name?: string): any {
    if (!name) return {};
    return collection.data?.envs?.[name];
  }

  function envSelected(name: string) {
    const selectedEnv = getEnv(name);
    const selectedEnvData = getEnvData(name);
    const selectedEnvProxy = selectedEnv?.proxy ?? 'ext';
    const secretsKeys = selectedEnv?.secretKeys ?? [];
    const selectedEnvSecrets: Secret[] = secretsKeys.map((key: any) => {
      return {
        key,
        value: DEFAULT_SECRET_VALUE,
        isChanged: false,
      };
    });
    setState({
      ...state,
      selectedEnvName: name,
      selectedEnvData,
      selectedEnvProxy,
      selectedEnvSecrets,
    });
    saveSelectedEnv(collection.id, name);
  }

  function setDefaultEnv() {
    let defaultEnvName = envNames.find((el) => el === selectedEnvs[collection.id]);
    if (!defaultEnvName && envNames.length !== 0) {
      defaultEnvName = envNames[0];
    }
    if (defaultEnvName) {
      envSelected(defaultEnvName);
    }
  }

  if (!state.selectedEnvName) {
    setDefaultEnv();
  }

  async function handleCreateEnvClicked() {
    try {
      let options: any = {
        method: 'POST',
      };
      const copiedData = kvRowsToMap(getEnvData(state.envNameToCopy));
      const proxy = getEnv(state.envNameToCopy)?.proxy ?? 'ext';

      if (state.modalState === 'copy') {
        const body = { data: copiedData, proxy };
        options.body = JSON.stringify(body);
      }

      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.newEnvName}`,
        options,
      );
      if (res.status !== 200) throw Error();

      const data = state.modalState === 'copy' ? copiedData : {};

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          envs: {
            ...collection.data?.envs,
            [state.newEnvName]: {
              data,
              proxy,
            },
          },
        },
      });
      saveSelectedEnv(collection.id, state.newEnvName);
      setState({
        ...state,
        newEnvName: '',
        modalState: 'default',
        selectedEnvName: state.newEnvName,
        selectedEnvProxy: proxy,
        selectedEnvData: mapToKvRows(copiedData),
        selectedEnvSecrets: [],
        envNameToCopy: undefined,
      });
      successToast('Environment created.', toast);
    } catch (e) {
      errorToast('Could not create environment', toast);
    }
  }

  async function handleDeleteEnvClicked() {
    try {
      if (!state.selectedEnvName || envNames.length <= 1) throw Error();
      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.selectedEnvName}`,
        {
          method: 'DELETE',
        },
      );
      if (res.status !== 200) throw Error();

      const newEnvs = collection.data?.envs ?? {};
      delete newEnvs[state.selectedEnvName];

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          envs: newEnvs,
        },
      });
      setState({
        ...state,
        newEnvName: '',
        modalState: 'default',
        selectedEnvName: undefined,
        selectedEnvData: undefined,
        selectedEnvSecrets: [],
        envNameToCopy: undefined,
      });
      successToast('Environment deleted.', toast);
    } catch (e) {
      errorToast('Could not delete environment', toast);
    }
  }

  async function handleSaveClicked() {
    try {
      if (!state.selectedEnvName) {
        onClose();
        return;
      }

      const data = kvRowsToMap(state.selectedEnvData ?? []);
      const proxy = state.selectedEnvProxy ?? 'ext';

      const body = { data, proxy };

      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.selectedEnvName}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
      );
      if (res.status !== 200) throw Error('Could not save environment');

      const oldEnvs = collection.data?.envs ?? {};
      const oldEnv = oldEnvs[state.selectedEnvName] ?? {};

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          envs: {
            ...oldEnvs,
            [state.selectedEnvName]: {
              ...oldEnv,
              data,
              proxy,
            },
          },
        },
      });
      onCloseClear();
      successToast('Environment saved.', toast);
    } catch (e) {
      errorToast('Could not save environment', toast);
    }
  }

  function onCloseClear() {
    setState({
      ...state,
      modalState: 'default',
      newEnvName: '',
      selectedEnvName: undefined,
      selectedEnvData: undefined,
    });
    onClose();
  }

  function isCreateDisabled() {
    return state.newEnvName === '' || envNames.includes(state.newEnvName);
  }

  async function handleCreateSecretClicked() {
    try {
      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.selectedEnvName}/secrets/${state.newSecretKey}`,
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

  async function handleSaveSecretClicked(i: number) {
    try {
      if (!state.selectedEnvSecrets) return;
      const secret = { ...state.selectedEnvSecrets[i] };
      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.selectedEnvName}/secrets/${secret.key}`,
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
      successToast('secret saved', toast);
    } catch (e) {
      errorToast('Failed to set secret', toast);
    }
  }

  async function handleDeleteSecretClicked(i: number) {
    try {
      if (!state.selectedEnvSecrets) return;
      const secret = { ...state.selectedEnvSecrets[i] };
      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.selectedEnvName}/secrets/${secret.key}`,
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
    if (!state.selectedEnvSecrets || !state.selectedEnvName) return;
    const newSecret: Secret = {
      key,
      value: DEFAULT_SECRET_VALUE,
      isChanged: false,
    };
    const selectedEnv = getEnv(state.selectedEnvName);
    const newSecrets = [...state.selectedEnvSecrets, newSecret];
    const newSecretKeys = newSecrets.map((el) => el.key);
    setState({
      ...state,
      selectedEnvSecrets: newSecrets,
      newSecretKey: '',
      newSecretValue: '',
    });
    saveCollection({
      ...collection,
      data: {
        ...collection.data,
        envs: {
          ...collection.data.envs,
          [state.selectedEnvName]: {
            ...selectedEnv,
            secretKeys: newSecretKeys,
          },
        },
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
    if (!state.selectedEnvSecrets || !state.selectedEnvName) return;
    const selectedEnv = getEnv(state.selectedEnvName);
    const newSecrets = [...state.selectedEnvSecrets];
    newSecrets.splice(i, 1);
    setState({ ...state, selectedEnvSecrets: newSecrets });
    const newSecretKeys = newSecrets.map((el) => el.key);
    saveCollection({
      ...collection,
      data: {
        ...collection.data,
        envs: {
          ...collection.data.envs,
          [state.selectedEnvName]: {
            ...selectedEnv,
            secretKeys: newSecretKeys,
          },
        },
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

  return (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading="Environments"
      onClick={handleSaveClicked}
      buttonText="Save"
      buttonColor="green"
      isButtonDisabled={false}
    >
      {state.modalState === 'create' || state.modalState === 'copy' ? (
        <HStack mb="4">
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
            disabled={!state.selectedEnvName}
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
            value={state.selectedEnvName}
          >
            {envNames.map((env: any) => (
              <option key={`${collection.id}-${env}`}>{env}</option>
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
                envNameToCopy: state.selectedEnvName,
                newEnvName: `${state.selectedEnvName}-copy`,
              })
            }
            disabled={!state.selectedEnvName}
            marginInlineStart="0"
          />
          <IconButton
            icon={<DeleteIcon />}
            variant="ghost"
            colorScheme="red"
            disabled={!state.selectedEnvName || envNames.length <= 1}
            aria-label="Open form to create new environment"
            onClick={handleDeleteEnvClicked}
            marginInlineStart="0"
          />
        </HStack>
      )}

      {state.selectedEnvName ? (
        <>
          <Heading as="h6" size="xs" my="4">
            Proxy
          </Heading>
          <Select
            w="100%"
            borderRadius={20}
            colorScheme="green"
            onChange={(e) => setState({ ...state, selectedEnvProxy: e.target.value })}
            value={state.selectedEnvProxy}
          >
            <option value="ext">Extension</option>
            <option value="server">Server</option>
          </Select>
          <Heading as="h6" size="xs" my="4">
            Variables
          </Heading>
          <KVEditor
            name="env"
            kvs={state.selectedEnvData ?? []}
            setKvs={(kvs: KVRow[]) => setState({ ...state, selectedEnvData: kvs })}
          />
          {state.selectedEnvProxy === 'server' ? (
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
            </>
          ) : null}
        </>
      ) : null}
    </BasicModal>
  );
};

export default EnvironmentModal;
