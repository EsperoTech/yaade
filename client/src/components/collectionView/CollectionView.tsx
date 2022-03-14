import { AddIcon, ChevronRightIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
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
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import Collection from '../../model/Collection';
import Request from '../../model/Request';
import { errorToast, successToast } from '../../utils';
import { cn } from '../../utils';
import BasicModal from '../basicModal';
import CollectionRequest from '../CollectionRequest/CollectionRequest';
import styles from './CollectionView.module.css';

type CollectionProps = {
  collection: Collection;
  handleCollectionClick: any;
  handleRequestClick: any;
  setCollection: any;
  removeCollection: any;
};

type CollectionState = {
  name: string;
  newRequestName: string;
  currentModal: string;
};

function CollectionView({
  collection,
  handleCollectionClick,
  handleRequestClick,
  setCollection,
  removeCollection,
}: CollectionProps) {
  const [state, setState] = useState<CollectionState>({
    name: collection.data.name,
    newRequestName: '',
    currentModal: '',
  });
  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const variants = collection.open ? ['open'] : [];
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  function handleOnKeyDown(e: any, action: any) {
    if (e.key === 'Enter') {
      action(e);
    }
  }

  async function handleCreateRequestClick() {
    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: state.newRequestName,
          collectionId: collection.id,
          type: 'REST',
        }),
      });

      const newRequest = (await response.json()) as Request;

      setCollection({
        ...collection,
        requests: [...collection.requests, newRequest],
      });
      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      errorToast('The request could be not created', toast);
    }
  }

  async function handleRenameCollectionClick() {
    try {
      const response = await fetch('/api/collection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...collection,
          data: {
            ...collection.data,
            name: state.name,
          },
        }),
      });
      if (response.status !== 200) throw new Error();

      setCollection({
        ...collection,
        data: {
          ...collection.data,
          name: state.name,
        },
      });
      onCloseClear();
      successToast('Collection was renamed.', toast);
    } catch (e) {
      errorToast('The collection could not be renamed.', toast);
    }
  }

  async function handleDeleteCollectionClick() {
    try {
      const response = await fetch(`/api/collection/${collection.id}`, {
        method: 'DELETE',
      });
      if (response.status !== 200) throw new Error();
      removeCollection();
      onCloseClear();
      successToast('Collection was deleted.', toast);
    } catch (e) {
      errorToast('Could not delete collection.', toast);
    }
  }

  function removeRequest(requestId: number) {
    const newRequests = [...collection.requests];
    const i = newRequests.findIndex((r) => r.id === requestId);
    newRequests.splice(i, 1);
    setCollection({
      ...collection,
      requests: newRequests,
    });
  }

  function updateRequest(request: Request) {
    const i = collection.requests.findIndex((r) => r.id === request.id);
    const newRequests = [...collection.requests];
    newRequests.splice(i, 1, request);
    const newCollection = {
      ...collection,
      requests: newRequests,
    };
    setCollection(newCollection);
  }

  function onCloseClear() {
    setState({ ...state, newRequestName: '', name: collection.data.name });
    onClose();
  }

  const newRequestModal = (
    <BasicModal
      isOpen={isOpen}
      onClose={onCloseClear}
      initialRef={initialRef}
      heading="Create a new request"
      onClick={handleCreateRequestClick}
      isButtonDisabled={state.newRequestName === ''}
      buttonText="Create"
      buttonColor="green"
    >
      <Input
        placeholder="Name"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        value={state.newRequestName}
        onChange={(e) => setState({ ...state, newRequestName: e.target.value })}
        ref={initialRef}
      />
    </BasicModal>
  );

  const renameModal = (
    <BasicModal
      isOpen={isOpen}
      onClose={onCloseClear}
      initialRef={initialRef}
      heading={`Rename ${collection.data.name}`}
      onClick={handleRenameCollectionClick}
      isButtonDisabled={state.name === collection.data.name || state.name === ''}
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
      heading={`Delete "${collection.data.name}"`}
      onClick={handleDeleteCollectionClick}
      buttonText="Delete"
      buttonColor="red"
      isButtonDisabled={false}
    >
      Are you sure you want to delete this collection?
      <br />
      The collection cannot be recovered!
    </BasicModal>
  );

  const currentModal = ((s: string) => {
    switch (s) {
      case 'newRequest':
        return newRequestModal;
      case 'rename':
        return renameModal;
      case 'delete':
        return deleteModal;
    }
  })(state.currentModal);

  return (
    <div className={styles.root}>
      <div
        className={cn(styles, 'header', [colorMode])}
        onClick={handleCollectionClick}
        onKeyDown={(e) => handleOnKeyDown(e, handleCollectionClick)}
        role="button"
        tabIndex={0}
      >
        <ChevronRightIcon className={cn(styles, 'icon', [...variants, colorMode])} />
        <span className={styles.name}>{collection.data.name}</span>
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
                icon={<AddIcon />}
                command="Cmd+T"
                onClick={(e) => {
                  e.stopPropagation();
                  setState({ ...state, currentModal: 'newRequest' });
                  onOpen();
                }}
              >
                New Request
              </MenuItem>
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
      </div>
      <div className={cn(styles, 'requests', [...variants, colorMode])}>
        {collection.requests?.map((request) => {
          return (
            <CollectionRequest
              key={`request-${request.id}`}
              request={request}
              handleRequestClick={handleRequestClick}
              removeRequest={() => removeRequest(request.id)}
              setRequest={updateRequest}
            />
          );
        })}
      </div>
      {currentModal}
    </div>
  );
}

export default CollectionView;
