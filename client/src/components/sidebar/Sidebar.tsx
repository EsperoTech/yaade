import { AddIcon } from '@chakra-ui/icons';
import {
  Box,
  IconButton,
  Input,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction, useContext, useRef, useState } from 'react';

import { CollectionsContext } from '../../context';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import { cn, errorToast, successToast } from '../../utils';
import BasicModal from '../basicModal';
import CollectionView from '../collectionView';
import styles from './Sidebar.module.css';

type StateProps = {
  clickedCollectionId: number;
  name: string;
  searchTerm: string;
};

type SideBarProps = {
  setCurrentRequest: Dispatch<SetStateAction<Request>>;
};

function Sidebar({ setCurrentRequest }: SideBarProps) {
  const toast = useToast();
  const { collections, saveCollection } = useContext(CollectionsContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [state, setState] = useState<StateProps>({
    clickedCollectionId: -1,
    name: '',
    searchTerm: '',
  });
  const { colorMode } = useColorMode();
  const initialRef = useRef(null);

  const filteredCollections = collections.filter((c) =>
    c.data.name.toLowerCase().includes(state.searchTerm.toLowerCase()),
  );

  function onCloseClear() {
    setState({ ...state, name: '' });
    onClose();
  }

  async function handleCreateCollectionClick() {
    try {
      const response = await fetch('/api/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: state.name }),
      });
      if (response.status !== 200) throw new Error();
      const newCollection = (await response.json()) as Collection;

      saveCollection(newCollection);
      successToast('A new collection was created and saved', toast);
      onCloseClear();
    } catch (e) {
      console.log(e);
      errorToast('The collection could be not created', toast);
    }
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%" w="100%">
      <div className={cn(styles, 'searchContainer', [colorMode])}>
        <input
          className={cn(styles, 'search', [colorMode])}
          placeholder="Search..."
          value={state.searchTerm}
          onChange={(e) => setState({ ...state, searchTerm: e.target.value })}
        />
        <IconButton
          aria-label="add-collection-button"
          icon={<AddIcon />}
          variant="ghost"
          onClick={onOpen}
        />
      </div>
      <div className={styles.collections}>
        {filteredCollections.map((collection) => (
          <CollectionView
            key={`sidebar-collection-${collection.id}`}
            collection={collection}
            setCurrentRequest={setCurrentRequest}
          />
        ))}
      </div>

      <BasicModal
        isOpen={isOpen}
        onClose={onCloseClear}
        initialRef={initialRef}
        heading="Create a new collection"
        onClick={handleCreateCollectionClick}
        isButtonDisabled={state.name === ''}
        buttonText="Create"
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
    </Box>
  );
}

export default Sidebar;
