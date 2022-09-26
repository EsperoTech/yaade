import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FunctionComponent, useContext } from 'react';
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import { UserContext } from '../../context';
import { CollectionsContext } from '../../context/CollectionsContext';
import {
  CurrentRequestContext,
  defaultRequest,
} from '../../context/CurrentRequestContext';
import Request from '../../model/Request';
import { errorToast, successToast } from '../../utils';
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
  const { currentRequest, isChanged, setCurrentRequest } =
    useContext(CurrentRequestContext);
  const { writeRequestToCollections, removeRequest } = useContext(CollectionsContext);

  const { user } = useContext(UserContext);
  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const variants = currentRequest.id === request.id ? ['selected'] : [];

  async function handleSaveRequest(currentRequest: Request) {
    try {
      const response = await fetch('/api/request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentRequest),
      });
      if (response.status !== 200) throw new Error();
      writeRequestToCollections(currentRequest);
    } catch (e) {
      errorToast('Could not save request', toast);
    }
  }

  async function handleRequestClick() {
    if (user?.data.settings.saveOnClose && isChanged && currentRequest.id !== -1) {
      // case if we want to auto save req on close
      handleSaveRequest(currentRequest);
      setCurrentRequest(request);
    } else if (
      !user?.data.settings?.saveOnClose &&
      isChanged &&
      currentRequest.id !== -1
    ) {
      // case if we want to ask for save on close
      setState({ ...state, currentModal: 'save' });
      onOpen();
    } else {
      // case if req is not changed or not saved yet
      setCurrentRequest(request);
    }
  }

  async function handleRenameRequestClick() {
    try {
      const response = await fetch('/api/request', {
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
      const response = await fetch(`/api/request/${request.id}`, { method: 'DELETE' });
      if (response.status !== 200) throw new Error();
      if (request.id === currentRequest.id) {
        setCurrentRequest(defaultRequest);
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
        handleSaveRequest(currentRequest);
        setCurrentRequest(request);
        onCloseClear();
      }}
      buttonText="Save"
      buttonColor="green"
      isButtonDisabled={false}
      secondaryButtonText="Discard"
      onSecondaryButtonClick={() => {
        setCurrentRequest(request);
        onCloseClear();
      }}
    >
      The request has unsaved changes which will be lost if you choose to change the tab
      now.
      <br />
      Do you want to save the changes now?
    </BasicModal>
  );

  let currentModal;

  if (state.currentModal === 'rename') {
    currentModal = renameModal;
  } else if (state.currentModal === 'delete') {
    currentModal = deleteModal;
  } else if (state.currentModal === 'save') {
    currentModal = requestNotSavedModal;
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
          <MenuButton
            as={IconButton}
            aria-label="Options"
            icon={<VscEllipsis />}
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
          />
          <MenuList zIndex={50}>
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
        </Menu>
      </span>
      {currentModal}
    </div>
  );
};

export default CollectionRequest;
