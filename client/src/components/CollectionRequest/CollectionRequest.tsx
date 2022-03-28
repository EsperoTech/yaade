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
import { Dispatch, FunctionComponent, SetStateAction, useContext } from 'react';
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import { CollectionsContext } from '../../context/collectionsContext/CollectionsContext';
import Request from '../../model/Request';
import { errorToast, successToast } from '../../utils';
import { cn, getMethodColor } from '../../utils';
import BasicModal from '../basicModal';
import styles from './CollectionRequest.module.css';

type CollectionRequestProps = {
  request: Request;
  setCurrentRequest: Dispatch<SetStateAction<Request>>;
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

const CollectionRequest: FunctionComponent<CollectionRequestProps> = ({
  request,
  setCurrentRequest,
}) => {
  const [state, setState] = useState<CollectionRequestState>({
    name: request.data.name,
    currentModal: '',
  });
  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { writeRequestToCollections, removeRequest } = useContext(CollectionsContext);
  const toast = useToast();
  const variants = [''];

  function handleRequestClick() {
    // TODO: ask user to save request before loading new content
    setCurrentRequest(request);
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

  const currentModal = state.currentModal === 'rename' ? renameModal : deleteModal;

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
