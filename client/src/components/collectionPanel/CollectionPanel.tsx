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
import { VscSave } from 'react-icons/vsc';

import Collection from '../../model/Collection';
import {
  patchCurrentCollectionData,
  useGlobalState,
  writeCollectionData,
} from '../../state/GlobalState';
import { BASE_PATH, cn, errorToast, successToast } from '../../utils';
import { useKeyPress } from '../../utils/useKeyPress';
import styles from './CollectionPanel.module.css';
import EnvironmentsTab from './EnvironmentsTab';
import OverviewTab from './OverviewTab';

interface CollectionPanelProps {
  currentCollection: Collection;
}

export default function CollectionPanel({ currentCollection }: CollectionPanelProps) {
  const globalState = useGlobalState();
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

      writeCollectionData(currentCollection.id, currentCollection.data);
      globalState.collectionChanged.set(false);
      successToast('Collection was saved.', toast);
    } catch (e) {
      errorToast('The collection could not be saved.', toast);
    }
  };

  const markCollectionChanged = () => {
    globalState.collectionChanged.set(true);
  };

  const setName = (name: string) => {
    patchCurrentCollectionData({ name });
    globalState.collectionChanged.set(true);
  };

  const setDescription = (description: string) => {
    patchCurrentCollectionData({ description });
    globalState.collectionChanged.set(true);
  };

  const setEnvs = (envs: any) => {
    patchCurrentCollectionData({ envs });
    globalState.collectionChanged.set(true);
  };

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
          disabled={!globalState.collectionChanged.get()}
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
          <Tab>Overview</Tab>
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
              markCollectionChanged={markCollectionChanged}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
