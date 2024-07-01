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
import { Dispatch, FunctionComponent } from 'react';
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import { SidebarRequest } from '../../model/Request';
import { CollectionsAction } from '../../state/collections';
import { successToast } from '../../utils';
import { cn, getMethodColor } from '../../utils';
import BasicModal from '../basicModal';
import styles from './CollectionRequest.module.css';

type CollectionRequestProps = {
  request: SidebarRequest;
  selected: boolean;
  selectRequest: any;
  depth: number;
  dispatchCollections: Dispatch<CollectionsAction>;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
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
  selected,
  depth,
  renameRequest,
  selectRequest,
  deleteRequest,
  duplicateRequest,
}) => {
  const [state, setState] = useState<CollectionRequestState>({
    name: request.name,
    currentModal: '',
  });

  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { onCopy } = useClipboard(
    `${window.location.origin}/#/${request.collectionId}/${request.id}`,
  );
  const { onCopy: onCopyRequestId } = useClipboard(`${request.id}`);
  const variants = selected ? ['selected'] : [];

  function onCloseClear() {
    setState({ ...state, name: request.name });
    onClose();
  }

  const renameModal = (
    <BasicModal
      isOpen={isOpen}
      onClose={onCloseClear}
      initialRef={initialRef}
      heading={`Rename ${request.name}`}
      onClick={() => {
        renameRequest(request.id, state.name);
        onCloseClear();
      }}
      isButtonDisabled={state.name === request.name || state.name === ''}
      buttonText="Rename"
      buttonColor="green"
    >
      <Input
        placeholder="Name"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        backgroundColor={colorMode === 'light' ? 'white' : undefined}
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
      heading={`Delete "${request.name}"`}
      onClick={() => deleteRequest(request.id)}
      buttonText="Delete"
      buttonColor="red"
      isButtonDisabled={false}
    >
      Are you sure you want to delete this request?
      <br />
      The request cannot be recovered!
    </BasicModal>
  );

  const duplicateModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Duplicate "${request.name}"`}
      onClick={() => {
        duplicateRequest(request.id, state.name);
        onCloseClear();
      }}
      buttonText="Duplicate"
      buttonColor="green"
      isButtonDisabled={false}
    >
      <Input
        placeholder="Name"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        backgroundColor={colorMode === 'light' ? 'white' : undefined}
        value={state.name}
        onChange={(e) => setState({ ...state, name: e.target.value })}
        ref={initialRef}
      />
    </BasicModal>
  );

  let currentModal;

  if (state.currentModal === 'rename') {
    currentModal = renameModal;
  } else if (state.currentModal === 'delete') {
    currentModal = deleteModal;
  } else if (state.currentModal === 'duplicate') {
    currentModal = duplicateModal;
  }

  let methodName = request.method;

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
      onClick={() => selectRequest.current(request.id)}
      onKeyDown={(e) => handleOnKeyDown(e, () => selectRequest.current(request.id))}
      role="button"
      tabIndex={0}
    >
      {Array(depth + 1).fill(<div className={styles.line} />)}
      <span
        className={cn(styles, 'requestMethod', [colorMode])}
        style={{ ...getMethodColor(request.method), marginLeft: '0.8rem' }}
      >
        {methodName}
      </span>
      <span className={cn(styles, 'requestName', [colorMode])}>{request.name}</span>
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
                    setState({ ...state, currentModal: 'rename', name: request.name });
                    onOpen();
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  icon={<CopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({
                      ...state,
                      currentModal: 'duplicate',
                      name: `${request.name} (copy)`,
                    });
                    onOpen();
                  }}
                >
                  Duplicate
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
