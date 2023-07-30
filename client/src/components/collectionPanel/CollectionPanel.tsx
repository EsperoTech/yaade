import {
  Box,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import React from 'react';
import { VscSave } from 'react-icons/vsc';

import { CurrentCollection } from '../../model/Collection';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import {
  CurrentCollectionAction,
  CurrentCollectionActionType,
} from '../../state/currentCollection';
import { BASE_PATH, cn, errorToast, successToast } from '../../utils';
import { useKeyPress } from '../../utils/useKeyPress';
import styles from './CollectionPanel.module.css';
import EnvironmentsTab from './EnvironmentsTab';
import OverviewTab from './OverviewTab';

interface CollectionPanelProps {
  currentCollection: CurrentCollection;
  dispatchCurrentCollection: React.Dispatch<CurrentCollectionAction>;
  dispatchCollections: React.Dispatch<CollectionsAction>;
}

export default function CollectionPanel({
  currentCollection,
  dispatchCurrentCollection,
  dispatchCollections,
}: CollectionPanelProps) {
  const { colorMode } = useColorMode();
  const toast = useToast();

  const handleSaveCollection = async () => {
    try {
      const response = await fetch(BASE_PATH + 'api/collection', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentCollection),
      });
      if (response.status !== 200) throw new Error();

      dispatchCollections({
        type: CollectionsActionType.PATCH_COLLECTION_DATA,
        id: currentCollection.id,
        data: currentCollection.data,
      });
      dispatchCurrentCollection({
        type: CurrentCollectionActionType.SET_IS_CHANGED,
        isChanged: false,
      });
      successToast('Collection was saved.', toast);
    } catch (e) {
      errorToast('The collection could not be saved.', toast);
    }
  };

  const setName = (name: string) =>
    dispatchCurrentCollection({
      type: CurrentCollectionActionType.PATCH_DATA,
      data: { name },
    });

  const setDescription = (description: string) =>
    dispatchCurrentCollection({
      type: CurrentCollectionActionType.PATCH_DATA,
      data: { description },
    });

  const setEnvs = (envs: any) =>
    dispatchCurrentCollection({
      type: CurrentCollectionActionType.PATCH_DATA,
      data: { envs },
    });

  useKeyPress(handleSaveCollection, 's', true);

  return (
    <Box className={styles.box} bg="panelBg" h="100%">
      <div style={{ display: 'flex' }}>
        <input
          className={cn(styles, 'input', [colorMode])}
          type="text"
          placeholder="Name"
          value={currentCollection.data.name ?? ''}
          onChange={(e) => setName(e.target.value)}
        />
        <IconButton
          aria-label="start-rename-button"
          icon={<VscSave />}
          variant="ghost"
          size="sm"
          ml="2"
          disabled={!currentCollection.isChanged}
          onClick={handleSaveCollection}
        />
      </div>
      <Tabs
        colorScheme="green"
        mt="1"
        display="flex"
        flexDirection="column"
        maxHeight="100%"
        h="100%"
        mb="4"
      >
        <TabList>
          <Tab>Description</Tab>
          <Tab>Environments</Tab>
        </TabList>
        <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
          <TabPanel h="100%">
            <OverviewTab
              description={currentCollection.data.description ?? ''}
              setDescription={setDescription}
            />
          </TabPanel>
          <TabPanel>
            <EnvironmentsTab
              collectionId={currentCollection.id}
              envs={currentCollection.data.envs}
              setEnvs={setEnvs}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
