import { CopyIcon, DeleteIcon, EditIcon, LinkIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useClipboard,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { State } from '@hookstate/core';
import { FunctionComponent, useContext } from 'react';
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';
import { useNavigate } from 'react-router-dom';

import { UserContext } from '../../context';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import {
  defaultRequest,
  removeRequest,
  setCurrentRequest,
  useGlobalState,
  writeCollectionData,
  writeRequestToCollections,
} from '../../state/GlobalState';
import { BASE_PATH, errorToast, successToast } from '../../utils';
import { cn, getMethodColor } from '../../utils';
import BasicModal from '../basicModal';
import styles from './CollectionRequest.module.css';

type CollectionRequestProps = {
  request: Request;
};

type CollectionRequestState = {
  name: string;
  currentModal: string;
};

function handleOnKeyDown(e: any, action: any) {
  if (e.key === 'Enter') {
    action(e);
  }
}

const CollectionRequest: FunctionComponent<CollectionRequestProps> = ({ request }) => {
  const [state, setState] = useState<CollectionRequestState>({
    name: request.data.name,
    currentModal: '',
  });
  const globalState = useGlobalState();

  const { user } = useContext(UserContext);
  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { onCopy } = useClipboard(
    `${window.location.origin}/#/${request.collectionId}/${request.id}`,
  );
  const { onCopy: onCopyRequestId } = useClipboard(`${request.id}`);
  const navigate = useNavigate();
  const currentRequest = globalState.currentRequest.get({ noproxy: true });
  const currentCollection = globalState.currentCollection.get({ noproxy: true });
  const variants = currentRequest?.id === request.id ? ['selected'] : [];

  async function handleSaveRequest(request: Request) {
    try {
      const response = await fetch(BASE_PATH + 'api/request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      if (response.status !== 200) throw new Error();
      writeRequestToCollections(request);
      globalState.requestChanged.set(false);
    } catch (e) {
      errorToast('Could not save request', toast);
    }
  }

  async function handleSaveCollection(collection: Collection) {
    try {
      const response = await fetch(BASE_PATH + 'api/collection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collection),
      });
      if (response.status !== 200) throw new Error();

      writeCollectionData(collection.id, collection.data);
      globalState.collectionChanged.set(false);
      successToast('Collection was saved.', toast);
    } catch (e) {
      errorToast('The collection could not be saved.', toast);
    }
  }

  function saveOnClose() {
    if (currentRequest && globalState.requestChanged.value && currentRequest?.id !== -1) {
      handleSaveRequest(currentRequest);
    } else if (currentCollection && globalState.collectionChanged.value) {
      handleSaveCollection(currentCollection);
    }
    globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
    globalState.currentCollection.set(undefined);
    globalState.requestChanged.set(false);
    globalState.collectionChanged.set(false);
  }

  function handleRequestClick() {
    console.log(globalState.collections.get({ noproxy: true }));
    navigate(`/${request.collectionId}/${request.id}`);
    if (currentRequest?.id === request.id) return;
    if (user?.data?.settings?.saveOnClose) {
      saveOnClose();
    } else if (
      currentRequest &&
      globalState.requestChanged.value &&
      currentRequest?.id !== -1
    ) {
      setState({ ...state, currentModal: 'save-request' });
      onOpen();
    } else if (currentCollection && globalState.collectionChanged.value) {
      setState({ ...state, currentModal: 'save-collection' });
      onOpen();
    } else {
      globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
      globalState.currentCollection.set(undefined);
    }
  }

  async function handleRenameRequestClick() {
    try {
      const response = await fetch(BASE_PATH + 'api/request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          data: {
            ...request.data,
            name: state.name,
          },
        }),
      });
      if (response.status !== 200) throw new Error();

      const renamedRequest = {
        ...request,
        data: {
          ...request.data,
          name: state.name,
        },
      };

      setCurrentRequest(renamedRequest);
      writeRequestToCollections(renamedRequest);
      onCloseClear();
      successToast('Request was renamed.', toast);
    } catch (e) {
      errorToast('The request could not be renamed.', toast);
    }
  }

  async function handleDeleteRequestClick() {
    try {
      const response = await fetch(BASE_PATH + `api/request/${request.id}`, {
        method: 'DELETE',
      });
      if (response.status !== 200) throw new Error();
      if (request.id === currentRequest?.id) {
        globalState.currentRequest.set(defaultRequest);
      }
      removeRequest(request);
      successToast('Request was deleted.', toast);
    } catch (e) {
      errorToast('Could not delete request.', toast);
    }
  }

  function onCloseClear() {
    setState({ ...state, name: request.data.name });
    onClose();
  }

  const renameModal = (
    <BasicModal
      isOpen={isOpen}
      onClose={onCloseClear}
      initialRef={initialRef}
      heading={`Rename ${request.data.name}`}
      onClick={handleRenameRequestClick}
      isButtonDisabled={state.name === request.data.name || state.name === ''}
      buttonText="Rename"
      buttonColor="green"
    >
      <Input
        placeholder="Name"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        value={state.name}
        onChange={(e) => setState({ ...state, name: e.target.value })}
        ref={initialRef}
      />
    </BasicModal>
  );

  const deleteModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Delete "${request.data.name}"`}
      onClick={handleDeleteRequestClick}
      buttonText="Delete"
      buttonColor="red"
      isButtonDisabled={false}
    >
      Are you sure you want to delete this request?
      <br />
      The request cannot be recovered!
    </BasicModal>
  );

  const requestNotSavedModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Request not saved`}
      onClick={() => {
        saveOnClose();
        onCloseClear();
      }}
      buttonText="Save"
      buttonColor="green"
      isButtonDisabled={false}
      secondaryButtonText="Discard"
      onSecondaryButtonClick={() => {
        globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
        globalState.requestChanged.set(false);
        onCloseClear();
      }}
    >
      The request has unsaved changes which will be lost if you choose to change the tab
      now.
      <br />
      Do you want to save the changes now?
    </BasicModal>
  );

  const collectionNotSavedModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Collection not saved`}
      onClick={() => {
        saveOnClose();
        onCloseClear();
      }}
      buttonText="Save"
      buttonColor="green"
      isButtonDisabled={false}
      secondaryButtonText="Discard"
      onSecondaryButtonClick={() => {
        globalState.currentRequest.set(JSON.parse(JSON.stringify(request)));
        globalState.currentCollection.set(undefined);
        globalState.collectionChanged.set(false);
        onCloseClear();
      }}
    >
      The collection has unsaved changes which will be lost if you choose to change the
      tab now.
      <br />
      Do you want to save the changes now?
    </BasicModal>
  );

  let currentModal;

  if (state.currentModal === 'rename') {
    currentModal = renameModal;
  } else if (state.currentModal === 'delete') {
    currentModal = deleteModal;
  } else if (state.currentModal === 'save-request') {
    currentModal = requestNotSavedModal;
  } else if (state.currentModal === 'save-collection') {
    currentModal = collectionNotSavedModal;
  }

  let methodName = request.data.method;

  if (methodName === 'DELETE') {
    methodName = 'DEL';
  } else if (methodName === 'OPTIONS') {
    methodName = 'OPT';
  } else if (methodName === 'PATCH') {
    methodName = 'PTCH';
  } else if (methodName === 'TRACE') {
    methodName = 'TRCE';
  } else if (methodName === 'CONNECT') {
    methodName = 'CON';
  }

  return (
    <div
      className={cn(styles, 'request', [...variants, colorMode])}
      onClick={handleRequestClick}
      onKeyDown={(e) => handleOnKeyDown(e, handleRequestClick)}
      role="button"
      tabIndex={0}
    >
      <span
        className={cn(styles, 'requestMethod', [colorMode])}
        style={getMethodColor(request.data.method)}
      >
        {methodName}
      </span>
      <span className={cn(styles, 'requestName', [colorMode])}>{request.data.name}</span>
      <span className={styles.actionIcon}>
        <Menu>
          {({ isOpen }) => (
            <>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<VscEllipsis />}
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList
                zIndex={50}
                style={{
                  // this is a workaround to fix drag and drop preview not working
                  // see: https://github.com/chakra-ui/chakra-ui/issues/6762
                  display: isOpen ? '' : 'none',
                }}
              >
                <MenuItem
                  icon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({ ...state, currentModal: 'rename' });
                    onOpen();
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  icon={<LinkIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                    successToast('Link copied to clipboard.', toast);
                  }}
                >
                  Copy Link
                </MenuItem>
                <MenuItem
                  icon={<CopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyRequestId();
                    successToast('Request ID copied to clipboard.', toast);
                  }}
                >
                  Copy ID
                </MenuItem>
                <MenuItem
                  icon={<DeleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({ ...state, currentModal: 'delete' });
                    onOpen();
                  }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </>
          )}
        </Menu>
      </span>
      {currentModal}
    </div>
  );
};

export default CollectionRequest;
