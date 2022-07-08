import { AddIcon, CheckIcon, CloseIcon, CopyIcon, DeleteIcon } from '@chakra-ui/icons';
import { Heading, HStack, IconButton, Input, Select, useToast } from '@chakra-ui/react';
import { FunctionComponent, useEffect, useRef, useState } from 'react';

import Collection from '../../../model/Collection';
import KVRow from '../../../model/KVRow';
import { errorToast, kvRowsToMap, mapToKvRows, successToast } from '../../../utils';
import { getSelectedEnvs, saveSelectedEnv } from '../../../utils/store';
import BasicModal from '../../basicModal';
import KVEditor from '../../kvEditor';

type EnvironmentModalProps = {
  collection: Collection;
  saveCollection: (c: Collection) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

type EnvironmentModalState = {
  modalState: 'create' | 'copy' | 'default';
  newEnvName: string;
  envNameToCopy?: string;
  selectedEnvName?: string;
  selectedEnvData?: KVRow[];
};

const EnvironmentModal: FunctionComponent<EnvironmentModalProps> = ({
  collection,
  saveCollection,
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<EnvironmentModalState>({
    modalState: 'default',
    newEnvName: '',
  });
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
    if (!env) return [];
    const data = Object.entries(env?.data ?? {}).map(([key, value]) => ({
      key,
      value: value as string,
    }));

    if (data.length === 0) {
      return [{ key: '', value: '' }];
    }

    return data;
  }

  function envSelected(name: string) {
    const selectedEnvData = getEnvData(name);
    setState({ ...state, selectedEnvName: name, selectedEnvData });
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
      const data = kvRowsToMap(getEnvData(state.envNameToCopy));
      if (state.modalState === 'copy') {
        options.body = JSON.stringify(data);
      }

      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.newEnvName}`,
        options,
      );
      if (res.status !== 200) throw Error();

      const newEnvData = state.modalState === 'copy' ? data : {};

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          envs: {
            ...collection.data?.envs,
            [state.newEnvName]: {
              data: newEnvData,
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
        selectedEnvData: mapToKvRows(data),
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

      const newEnvData = kvRowsToMap(state.selectedEnvData ?? []);

      const res = await fetch(
        `/api/collection/${collection.id}/envs/${state.selectedEnvName}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEnvData),
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
              data: newEnvData,
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
      selectedEnvData: getEnvData(state.selectedEnvName),
    });
    onClose();
  }

  function isCreateDisabled() {
    return state.newEnvName === '' || envNames.includes(state.newEnvName);
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
      <Heading as="h6" size="xs" my="4">
        Data
      </Heading>
      {state.selectedEnvName ? (
        <KVEditor
          name="env"
          kvs={state.selectedEnvData ?? []}
          setKvs={(kvs: KVRow[]) => setState({ ...state, selectedEnvData: kvs })}
        />
      ) : null}
    </BasicModal>
  );
};

export default EnvironmentModal;
