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
import { useContext, useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import { CollectionsContext, CurrentRequestContext } from '../../context';
import { parseRequest } from '../../context/CurrentRequestContext';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import { errorToast, groupsArrayToStr, successToast } from '../../utils';
import { cn } from '../../utils';
import BasicModal from '../basicModal';
import CollectionRequest from '../CollectionRequest/CollectionRequest';
import styles from './CollectionView.module.css';

type CollectionProps = {
  collection: Collection;
};

type CollectionState = {
  name: string;
  groups: string;
  newRequestName: string;
  currentModal: string;
};

function CollectionView({ collection }: CollectionProps) {
  const [state, setState] = useState<CollectionState>({
    name: collection.data.name,
    groups: groupsArrayToStr(collection.data?.groups),
    newRequestName: '',
    currentModal: '',
  });
  const { setCurrentRequest } = useContext(CurrentRequestContext);
  const initialRef = useRef(null);
  const { removeCollection, saveCollection, writeRequestToCollections } =
    useContext(CollectionsContext);
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

      writeRequestToCollections(newRequest);
      setCurrentRequest(parseRequest(newRequest));
      onCloseClear();
      successToast('A new request was created.', toast);
    } catch (e) {
      console.log(e);
      errorToast('The request could be not created', toast);
    }
  }

  async function handleEditCollectionClick() {
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
            groups: state.groups.split(','),
          },
        }),
      });
      if (response.status !== 200) throw new Error();

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          name: state.name,
          groups: state.groups.split(','),
        },
      });
      onClose();
      successToast('Collection was changed.', toast);
    } catch (e) {
      console.log(e, state);
      errorToast('The collection could not be changed.', toast);
    }
  }

  function handleCollectionClick() {
    saveCollection({
      ...collection,
      open: !collection.open,
    });
  }

  async function handleDeleteCollectionClick() {
    try {
      const response = await fetch(`/api/collection/${collection.id}`, {
        method: 'DELETE',
      });
      if (response.status !== 200) throw new Error();
      removeCollection(collection.id);
      onCloseClear();
      successToast('Collection was deleted.', toast);
    } catch (e) {
      errorToast('Could not delete collection.', toast);
    }
  }

  function onCloseClear() {
    setState({
      ...state,
      newRequestName: '',
      name: collection.data.name,
      groups: collection.data.groups?.join(',') ?? '',
    });
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

  const editModal = (
    <BasicModal
      isOpen={isOpen}
      onClose={onCloseClear}
      initialRef={initialRef}
      heading={`Edit ${collection.data.name}`}
      onClick={handleEditCollectionClick}
      isButtonDisabled={state.name === ''}
      buttonText="Edit"
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
        mb="4"
      />
      <Input
        placeholder="Groups"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        value={state.groups}
        onChange={(e) => setState({ ...state, groups: e.target.value })}
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
      case 'edit':
        return editModal;
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
                onClick={(e) => {
                  e.stopPropagation();
                  setState({ ...state, currentModal: 'edit' });
                  onOpen();
                }}
              >
                Edit
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
      </div>
      <div className={cn(styles, 'requests', [...variants, colorMode])}>
        {collection.requests?.map((request) => {
          return <CollectionRequest key={`request-${request.id}`} request={request} />;
        })}
      </div>
      {currentModal}
    </div>
  );
}

export default CollectionView;
