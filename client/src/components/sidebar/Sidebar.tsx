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
  useToast,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { useState } from 'react';

import Collection from '../../model/Collection';
import { cn } from '../../utils';
import CollectionView from '../CollectionView';
import styles from './Sidebar.module.css';

type SideBarProps = {
  collections: Array<Collection>;
  setCollections: any;
  handleRequestClick: any;
};

type SidebarState = {
  newCollectionName: string;
};

function Sidebar({ collections, setCollections, handleRequestClick }: SideBarProps) {
  const [state, setState] = useState<SidebarState>({
    newCollectionName: '',
  });
  const toast = useToast();

  function handleCollectionClick(i: number) {
    const newCollection = { ...collections[i], open: !collections[i].open };
    const newCollections = [...collections];
    newCollections[i] = newCollection;
    setCollections(newCollections);
  }

  async function handleCreateCollectionClick(closePopover: () => void) {
    try {
      const respone = await fetch('/api/collection', {
        method: 'POST',
        body: JSON.stringify({ name: state.newCollectionName }),
      });
      const newCollection = await respone.json();
      setCollections([...collections, newCollection]);
      toast({
        title: 'Collection created.',
        description: 'A new collection was created and saved.',
        status: 'success',
        isClosable: true,
      });
      setState({ ...state, newCollectionName: '' });
      closePopover();
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

  const initialFocusRef = useRef<HTMLInputElement>(null);

  return (
    <Box className={styles.box} bg="panelBg" h="100%" w="100%">
      <div className={cn(styles, 'searchContainer')}>
        <input
          className={cn(styles, 'search')}
          placeholder="Search..."
          value={state.newCollectionName}
          onChange={(e) => setState({ ...state, newCollectionName: e.target.value })}
        />
        <Popover initialFocusRef={initialFocusRef} placement="bottom" closeOnBlur={false}>
          {({ onClose }) => (
            <>
              <PopoverTrigger>
                <IconButton
                  aria-label="add-collection-button"
                  icon={<AddIcon />}
                  variant="ghost"
                />
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader>New Collection</PopoverHeader>
                <PopoverBody>
                  <input
                    className={cn(styles, 'search')}
                    placeholder="Name"
                    ref={initialFocusRef}
                  />
                  <Button
                    mt="6"
                    mr="2"
                    colorScheme="green"
                    size="sm"
                    onClick={() => handleCreateCollectionClick(onClose)}
                  >
                    SAVE
                  </Button>
                  <Button mt="6" mr="2" variant="ghost" size="sm" onClick={onClose}>
                    CANCEL
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </>
          )}
        </Popover>
      </div>
      <div className={styles.collections}>
        {collections.map((collection, i) => (
          <CollectionView
            key={`sidebar-collection-${collection.id}`}
            collection={collection}
            handleCollectionClick={() => handleCollectionClick(i)}
            handleRequestClick={handleRequestClick}
          />
        ))}
      </div>
    </Box>
  );
}

export default Sidebar;
