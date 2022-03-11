import { AddIcon } from '@chakra-ui/icons';
import { Box, IconButton, useColorMode, useDisclosure, useToast } from '@chakra-ui/react';
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

function Sidebar({ collections, setCollections, handleRequestClick }: SideBarProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isReqOpen, onOpen: onReqOpen, onClose: onReqClose } = useDisclosure();
  const [clickedCollectionId, setClickedCollectionId] = useState<number>(-1);
  const { colorMode } = useColorMode();

  function handleCollectionClick(i: number) {
    const newCollection = { ...collections[i], open: !collections[i].open };
    const newCollections = [...collections];
    newCollections[i] = newCollection;
    setCollections(newCollections);
  }

  async function handleCreateCollectionClick(name: string) {
    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (response.status !== 200) throw new Error();
      const newCollection = await response.json();
      setCollections([...collections, newCollection]);
      toast({
        title: 'Collection created.',
        description: 'A new collection was created and saved.',
        status: 'success',
        isClosable: true,
      });
      onClose();
    } catch (e) {
      console.log(e);
      toast({
        title: 'Error',
        description: 'The collection could be not created.',
        status: 'error',
        isClosable: true,
      });
    }
  }

  function updateCollections(newRequest: Request) {
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
    setCollections(newCollections);
  }

  async function handleCreateRequestClick(name: string) {
    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, collectionId: clickedCollectionId, type: 'REST' }),
      });
      const newRequest = (await response.json()) as Request;

      updateCollections(newRequest);
      onReqClose();
      toast({
        title: 'Request created.',
        description: 'A new request was created and saved.',
        status: 'success',
        isClosable: true,
      });
    } catch (e) {
      console.log(e);
      toast({
        title: 'Error',
        description: 'The request could be not created.',
        status: 'error',
        isClosable: true,
      });
    }
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%" w="100%">
      <div className={cn(styles, 'searchContainer', [colorMode])}>
        <input className={cn(styles, 'search', [colorMode])} placeholder="Search..." />
        <IconButton
          aria-label="add-collection-button"
          icon={<AddIcon />}
          variant="ghost"
          onClick={onOpen}
        />
        <CreateModal
          isOpen={isOpen}
          onClose={onClose}
          type="Collection"
          handleCreateClick={handleCreateCollectionClick}
        />
        <CreateModal
          isOpen={isReqOpen}
          onClose={onReqClose}
          type="Request"
          handleCreateClick={handleCreateRequestClick}
        />
      </div>
      <div className={styles.collections}>
        {collections.map((collection, i) => (
          <CollectionView
            key={`sidebar-collection-${collection.id}`}
            collection={collection}
            handleCollectionClick={() => handleCollectionClick(i)}
            handleRequestClick={handleRequestClick}
            onCreateRequestClick={() => {
              onReqOpen();
              setClickedCollectionId(collection.id);
            }}
          />
        ))}
      </div>
    </Box>
  );
}

export default Sidebar;
