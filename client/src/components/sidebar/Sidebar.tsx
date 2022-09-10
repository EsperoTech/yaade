import { AddIcon } from '@chakra-ui/icons';
import {
  Box,
  IconButton,
  Input,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction, useContext, useRef, useState } from 'react';

import { UserContext } from '../../context';
import { CollectionsContext } from '../../context/CollectionsContext';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import {
  cn,
  errorToast,
  groupsArrayToStr,
  groupsStrToArray,
  successToast,
} from '../../utils';
import BasicModal from '../basicModal';
import CollectionView from '../collectionView';
import GroupsInput from '../groupsInput';
import styles from './Sidebar.module.css';

type StateProps = {
  clickedCollectionId: number;
  name: string;
  groups: string[];
  searchTerm: string;
  openApiFile: any;
  basePath: string;
};

function Sidebar() {
  const toast = useToast();
  const { user } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [state, setState] = useState<StateProps>({
    clickedCollectionId: -1,
    name: '',
    groups: user?.data?.groups ?? [],
    searchTerm: '',
    openApiFile: undefined,
    basePath: '',
  });
  const { colorMode } = useColorMode();
  const initialRef = useRef(null);
  const { collections, saveCollection } = useContext(CollectionsContext);

  const filteredCollections = collections.filter((c) =>
    c.data.name.toLowerCase().includes(state.searchTerm.toLowerCase()),
  );

  function onCloseClear() {
    setState({ ...state, name: '', groups: user?.data?.groups ?? [] });
    onClose();
  }

  async function handleCreateCollectionClick() {
    try {
      let response;
      if (state.openApiFile) {
        const data = new FormData();
        data.append('File', state.openApiFile, 'openapi.yaml');

        response = await fetch(
          `/api/collection/importOpenApi?basePath=${
            state.basePath
          }&groups=${groupsArrayToStr(state.groups)}`,
          {
            method: 'POST',
            body: data,
          },
        );
      } else {
        response = await fetch('/api/collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: state.name,
            groups: state.groups,
          }),
        });
      }
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
        <Tabs
          colorScheme="green"
          display="flex"
          flexDirection="column"
          maxHeight="100%"
          h="100%"
        >
          <TabList>
            <Tab>Basic</Tab>
            <Tab>OpenAPI</Tab>
          </TabList>
          <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
            <TabPanel>
              <Input
                placeholder="Name"
                w="100%"
                my="4"
                borderRadius={20}
                colorScheme="green"
                value={state.name}
                onChange={(e) => setState({ ...state, name: e.target.value })}
                ref={initialRef}
              />
              <GroupsInput
                groups={state.groups}
                setGroups={(groups: string[]) =>
                  setState({
                    ...state,
                    groups,
                  })
                }
                isRounded
              />
            </TabPanel>
            <TabPanel>
              <Text>Upload an OpenAPI 3.0 file</Text>
              <input
                className={cn(styles, 'fileInput', [colorMode])}
                type="file"
                accept=".yaml,.json"
                onChange={(e) => {
                  const openApiFile = e.target.files ? e.target.files[0] : undefined;
                  setState({
                    ...state,
                    openApiFile,
                    name: openApiFile?.name ?? 'filename',
                  });
                }}
              />
              <Input
                placeholder="Base Path"
                my="4"
                w="100%"
                borderRadius={20}
                colorScheme="green"
                value={state.basePath}
                onChange={(e) => setState({ ...state, basePath: e.target.value })}
              />
              <GroupsInput
                groups={state.groups}
                setGroups={(groups: string[]) =>
                  setState({
                    ...state,
                    groups,
                  })
                }
                isRounded
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </BasicModal>
    </Box>
  );
}

export default Sidebar;
