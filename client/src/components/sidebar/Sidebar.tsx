import { Box } from '@chakra-ui/react';

import Collection from '../../model/Collection';
import { cn } from '../../utils';
import CollectionView from '../CollectionView';
import styles from './Sidebar.module.css';

type SideBarProps = {
  collections: Array<Collection>;
  setCollections: any;
  handleRequestClick: any;
};

function Sidebar({ collections, setCollections, handleRequestClick }: SideBarProps) {
  function handleCollectionClick(i: number) {
    const newCollection = { ...collections[i], open: !collections[i].open };
    const newCollections = [...collections];
    newCollections[i] = newCollection;
    setCollections(newCollections);
  }

  return (
    <Box className={styles.box} bg="panelBg" h="100%" w="100%">
      <div className={cn(styles, 'searchContainer')}>
        <input className={cn(styles, 'search')} placeholder="Search..." />
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
