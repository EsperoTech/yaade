import { AddIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  IconButton,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { useState } from 'react';

import Collection from '../../model/Collection';
import Request from '../../model/Request';
import { cn } from '../../utils';
import CollectionView from '../collectionView';
import CreateModal from '../createModal/CreateModal';
import styles from './Sidebar.module.css';

type SideBarProps = {
  collections: Array<Collection>;
  setCollections: any;
  handleRequestClick: any;
};

type SidebarState = {
  createModalType: string;
  handleCreateClick: any;
};

function Sidebar({ collections, setCollections, handleRequestClick }: SideBarProps) {
  const [state, setState] = useState<SidebarState>({
    createModalType: '',
    handleCreateClick: () => {},
  });
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  function handleCollectionClick(i: number) {
    const newCollection = { ...collections[i], open: !collections[i].open };
    const newCollections = [...collections];
    newCollections[i] = newCollection;
    setCollections(newCollections);
  }

  async function handleCreateCollectionClick(name: string, closeModal: () => void) {
    try {
      const respone = await fetch('/api/collection', {
        method: 'POST',
        body: JSON.stringify({ name: name }),
      });
      const newCollection = await respone.json();
      setCollections([...collections, newCollection]);
      toast({
        title: 'Collection created.',
        description: 'A new collection was created and saved.',
        status: 'success',
        isClosable: true,
      });
      closeModal();
    } catch (e) {
      console.log(e);
      toast({
        title: 'Could not create collection.',
        description: 'The collection could be not created.',
        status: 'error',
        isClosable: true,
      });
    }
  }

  function createUpdatedCollections(
    collections: Array<Collection>,
    newRequest: Request,
  ): Array<Collection> {
    const newCollections = [...collections];

    const i = collections.findIndex((c) => c.id === newRequest.collectionId)!;
    if (i === -1) {
      throw new Error();
    }

    const updatedCollection = {
      ...collections[i],
      requests: [...collections[i].requests, newRequest],
    };
    newCollections.splice(i, 1, updatedCollection);

    return newCollections;
  }

  async function handleCreateRequestClick(
    name: string,
    collectionId: string,
    closeModal: () => void,
  ) {
    try {
      const respone = await fetch('/api/request', {
        method: 'POST',
        body: JSON.stringify({ name, collectionId }),
      });
      const newRequest = (await respone.json()) as Request;

      const newCollections = createUpdatedCollections(collections, newRequest);

      setCollections(newCollections);
      toast({
        title: 'Request created.',
        description: 'A new request was created and saved.',
        status: 'success',
        isClosable: true,
      });
      closeModal();
    } catch (e) {
      console.log(e);
      toast({
        title: 'Could not create request.',
        description: 'An error occured. Please try again.',
        status: 'error',
        isClosable: true,
      });
    }
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%" w="100%">
      <div className={cn(styles, 'searchContainer')}>
        <input className={cn(styles, 'search')} placeholder="Search..." />
        <IconButton
          aria-label="add-collection-button"
          icon={<AddIcon />}
          variant="ghost"
          onClick={() => {
            setState({
              ...state,
              createModalType: 'collection',
              handleCreateClick: handleCreateCollectionClick,
            });
            onOpen();
          }}
        />
        <CreateModal
          isOpen={isOpen}
          onClose={onClose}
          type={state.createModalType}
          handleCreateClick={state.handleCreateClick}
        />
      </div>
      <div className={styles.collections}>
        {collections.map((collection, i) => (
          <CollectionView
            key={`sidebar-collection-${collection.id}`}
            collection={collection}
            handleCollectionClick={() => handleCollectionClick(i)}
            handleRequestClick={handleRequestClick}
            onOpenCreateRequestModal={() => {
              setState({
                ...state,
                createModalType: 'request',
                handleCreateClick: handleCreateRequestClick,
              });
              onOpen();
            }}
          />
        ))}
      </div>
    </Box>
  );
}

export default Sidebar;
