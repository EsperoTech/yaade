import {
  AddIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
} from '@chakra-ui/icons';
import {
  Heading,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Tag,
  TagCloseButton,
  TagLabel,
  useColorMode,
  useDisclosure,
  useToast,
  Wrap,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';
import { VscEllipsis } from 'react-icons/vsc';

import Collection from '../../model/Collection';
import Request from '../../model/Request';
import {
  removeCollection,
  saveCollection,
  useGlobalState,
  writeRequestToCollections,
} from '../../state/GlobalState';
import { errorToast, successToast } from '../../utils';
import { cn } from '../../utils';
import BasicModal from '../basicModal';
import CollectionRequest from '../CollectionRequest/CollectionRequest';
import styles from './CollectionView.module.css';
import EnvironmentModal from './EnvironmentModal';

type CollectionProps = {
  collection: Collection;
};

type CollectionState = {
  name: string;
  groups: Array<string>;
  newGroup: string;
  newRequestName: string;
  currentModal: string;
};

function CollectionView({ collection }: CollectionProps) {
  const [state, setState] = useState<CollectionState>({
    name: collection.data.name,
    groups: collection.data?.groups ?? [],
    newGroup: '',
    newRequestName: '',
    currentModal: '',
  });
  const globalState = useGlobalState();
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

      writeRequestToCollections(newRequest);
      globalState.currentRequest.set(newRequest);
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
            groups: state.groups,
          },
        }),
      });
      if (response.status !== 200) throw new Error();

      saveCollection({
        ...collection,
        data: {
          ...collection.data,
          name: state.name,
          groups: state.groups,
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
      groups: collection.data?.groups ?? [],
    });
    onClose();
  }

  function handleAddGroupClicked() {
    const newGroups = [...state.groups, state.newGroup];
    setState({
      ...state,
      groups: newGroups,
      newGroup: '',
    });
  }

  function handleDeleteGroupClicked(name: string) {
    const newGroups = state.groups.filter((el) => el !== name);
    setState({
      ...state,
      groups: newGroups,
    });
  }

  const currentModal = ((s: string) => {
    switch (s) {
      case 'newRequest':
        return (
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
      case 'edit':
        return (
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
            <Heading as="h6" size="xs" mb="4">
              Name
            </Heading>
            <Input
              placeholder="Name"
              w="100%"
              borderRadius={20}
              colorScheme="green"
              value={state.name}
              onChange={(e) => setState({ ...state, name: e.target.value })}
              ref={initialRef}
            />
            <Heading as="h6" size="xs" my="4">
              Groups
            </Heading>
            <HStack mb="4">
              <Input
                placeholder="Add a new group"
                w="100%"
                borderRadius={20}
                colorScheme="green"
                value={state.newGroup}
                onChange={(e) => setState({ ...state, newGroup: e.target.value })}
              />
              <IconButton
                icon={<CheckIcon />}
                variant="ghost"
                colorScheme="green"
                aria-label="Create new environment"
                disabled={state.newGroup === '' || state.groups.includes(state.newGroup)}
                onClick={handleAddGroupClicked}
              />
            </HStack>
            <Wrap>
              {state.groups.map((group) => (
                <Tag
                  size="sm"
                  key={`collection-group-list-${collection.id}-${group}`}
                  borderRadius="full"
                  variant="solid"
                  colorScheme="green"
                  mx="0.25rem"
                  my="0.2rem"
                >
                  <TagLabel>{group}</TagLabel>
                  <TagCloseButton onClick={() => handleDeleteGroupClicked(group)} />
                </Tag>
              ))}
            </Wrap>
          </BasicModal>
        );
      case 'delete':
        return (
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
      case 'env':
        return (
          <EnvironmentModal
            collection={collection}
            saveCollection={saveCollection}
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
          />
        );
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
                icon={<DragHandleIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  setState({ ...state, currentModal: 'env' });
                  onOpen();
                }}
              >
                Environment
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
