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
import { FunctionComponent } from 'react';
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import Request from '../../model/Request';
import { errorToast, successToast } from '../../utils';
import { cn, getMethodColor } from '../../utils';
import BasicModal from '../basicModal';
import styles from './CollectionRequest.module.css';

type CollectionRequestProps = {
  request: Request;
  handleRequestClick: Function;
  setRequest: any;
  removeRequest: any;
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
  handleRequestClick,
  removeRequest,
  setRequest,
}) => {
  const [state, setState] = useState<CollectionRequestState>({
    name: request.data.name,
    currentModal: '',
  });
  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const variants = request.selected ? ['selected'] : [];

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

      setRequest({
        ...request,
        data: {
          ...request.data,
          name: state.name,
        },
      });
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
      removeRequest();
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

  return (
    <div
      className={cn(styles, 'request', [...variants, colorMode])}
      onClick={() => handleRequestClick(request)}
      onKeyDown={(e) => handleOnKeyDown(e, () => handleRequestClick(request))}
      role="button"
      tabIndex={0}
    >
      <span
        className={cn(styles, 'requestMethod', [colorMode])}
        style={getMethodColor(request.data.method)}
      >
        {request.data.method}
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
              command="Cmd+O"
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
              command="Cmd+O"
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
