import { AddIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
  Box,
  IconButton,
  Input,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import React, { Dispatch, useContext, useRef, useState } from 'react';

import api from '../../api';
import { UserContext } from '../../context';
import Collection, { SidebarCollection } from '../../model/Collection';
import { CollectionsAction, CollectionsActionType } from '../../state/collections';
import { cn, errorToast, successToast } from '../../utils';
import BasicModal from '../basicModal';
import Collections from '../collections';
import GroupsInput from '../groupsInput';
import styles from './Sidebar.module.css';

type StateProps = {
  clickedCollectionId: number;
  name: string;
  groups: string[];
  searchTerm: string;
  uploadFile: any;
  basePath: string;
  selectedImport: string;
};

type SidebarProps = {
  collections: SidebarCollection[];
  currentCollectionId?: number;
  currentRequstId?: number;
  selectCollection: any;
  selectRequest: any;
  renameRequest: (id: number, newName: string) => void;
  deleteRequest: (id: number) => void;
  duplicateRequest: (id: number, newName: string) => void;
  duplicateCollection: (id: number, newName: string) => void;
  dispatchCollections: Dispatch<CollectionsAction>;
};

function Sidebar({
  collections,
  dispatchCollections,
  currentCollectionId,
  currentRequstId,
  selectCollection,
  selectRequest,
  renameRequest,
  deleteRequest,
  duplicateCollection,
  duplicateRequest,
}: SidebarProps) {
  const toast = useToast();
  const { user } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [state, setState] = useState<StateProps>({
    clickedCollectionId: -1,
    name: '',
    groups: user?.data?.groups ?? [],
    searchTerm: '',
    uploadFile: undefined,
    basePath: '',
    selectedImport: 'openapi',
  });
  const { colorMode } = useColorMode();
  const initialRef = useRef(null);

  const filteredCollections = React.useMemo(
    () =>
      collections.filter((c) =>
        c.name.toLowerCase().includes(state.searchTerm.toLowerCase()),
      ),
    [collections, state.searchTerm],
  );

  function onCloseClear() {
    setState({
      ...state,
      name: '',
      groups: user?.data?.groups ?? [],
      uploadFile: undefined,
      basePath: '',
      selectedImport: 'openapi',
    });
    onClose();
  }

  async function handleCreateCollectionClick() {
    try {
      let response;
      if (state.uploadFile) {
        const data = new FormData();
        data.append('File', state.uploadFile, 'file');

        if (state.selectedImport === 'openapi') {
          response = await api.importOpenApi(state.basePath, state.groups, data);
        } else {
          response = await api.importPostman(state.groups, data);
        }
      } else {
        response = await api.createCollection(state.name, state.groups);
      }

      if (response.status !== 200) throw new Error();
      const newCollection = (await response.json()) as Collection;

      dispatchCollections({
        type: CollectionsActionType.ADD_COLLECTION,
        collection: newCollection,
      });

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
        <div className={styles.searchWithClear}>
          <input
            className={cn(styles, 'search', [colorMode])}
            placeholder="Search..."
            value={state.searchTerm}
            onChange={(e) => setState({ ...state, searchTerm: e.target.value })}
          />
          <button
            className={cn(styles, 'clearSearch', [colorMode])}
            onClick={() => setState({ ...state, searchTerm: '' })}
          >
            {state.searchTerm !== '' ? (
              <svg
                width="12px"
                height="12px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="3"
                  y1="3"
                  x2="21"
                  y2="21"
                  stroke={colorMode === 'light' ? 'black' : 'white'}
                  strokeWidth="2"
                />
                <line
                  x1="21"
                  y1="3"
                  x2="3"
                  y2="21"
                  stroke={colorMode === 'light' ? 'black' : 'white'}
                  strokeWidth="2"
                />
              </svg>
            ) : null}
          </button>
        </div>

        <IconButton
          aria-label="add-collection-button"
          icon={<AddIcon />}
          variant="ghost"
          onClick={onOpen}
        />
        <IconButton
          aria-label="collapse-all-collection"
          icon={<HamburgerIcon />}
          variant="ghost"
          onClick={() => dispatchCollections({ type: CollectionsActionType.CLOSE_ALL })}
        />
      </div>

      <Collections
        collections={filteredCollections}
        currentCollectionId={currentCollectionId}
        currentRequstId={currentRequstId}
        selectCollection={selectCollection}
        selectRequest={selectRequest}
        renameRequest={renameRequest}
        deleteRequest={deleteRequest}
        duplicateRequest={duplicateRequest}
        duplicateCollection={duplicateCollection}
        dispatchCollections={dispatchCollections}
      />

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
          isLazy
          colorScheme="green"
          display="flex"
          flexDirection="column"
          maxHeight="100%"
          h="100%"
        >
          <TabList>
            <Tab>Basic</Tab>
            <Tab>Import</Tab>
          </TabList>
          <TabPanels overflowY="auto" sx={{ scrollbarGutter: 'stable' }} h="100%">
            <TabPanel>
              <Input
                placeholder="Name"
                w="100%"
                my="4"
                borderRadius={20}
                colorScheme="green"
                backgroundColor={colorMode === 'light' ? 'white' : undefined}
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
              <Select
                size="xs"
                onChange={(e) => setState({ ...state, selectedImport: e.target.value })}
                value={state.selectedImport}
              >
                <option value="openapi">OpenAPI</option>
                <option value="postman">Postman</option>
              </Select>
              <input
                className={cn(styles, 'fileInput', [colorMode])}
                type="file"
                accept=".yaml,.json"
                onChange={(e) => {
                  const openApiFile = e.target.files ? e.target.files[0] : undefined;
                  setState({
                    ...state,
                    uploadFile: openApiFile,
                    name: openApiFile?.name ?? 'filename',
                  });
                }}
              />
              {state.selectedImport === 'openapi' ? (
                <Input
                  placeholder="Base Path"
                  mb="4"
                  w="100%"
                  borderRadius={20}
                  colorScheme="green"
                  backgroundColor={colorMode === 'light' ? 'white' : undefined}
                  value={state.basePath}
                  onChange={(e) => setState({ ...state, basePath: e.target.value })}
                />
              ) : null}
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
