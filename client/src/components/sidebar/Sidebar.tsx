import { AddIcon } from '@chakra-ui/icons';
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
  Text,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction, useContext, useRef, useState } from 'react';

import { UserContext } from '../../context';
import Collection from '../../model/Collection';
import Request from '../../model/Request';
import { saveCollection, useGlobalState } from '../../state/GlobalState';
import {
  BASE_PATH,
  cn,
  errorToast,
  groupsArrayToStr,
  groupsStrToArray,
  successToast,
} from '../../utils';
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

function Sidebar() {
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
  const globalState = useGlobalState();

  const collections = globalState.collections.get({ noproxy: true });

  const filteredCollections = collections.filter((c) =>
    c.data.name.toLowerCase().includes(state.searchTerm.toLowerCase()),
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
          response = await fetch(
            BASE_PATH +
              `api/collection/importOpenApi?basePath=${
                state.basePath
              }&groups=${groupsArrayToStr(state.groups)}`,
            {
              method: 'POST',
              body: data,
            },
          );
        } else {
          response = await fetch(
            BASE_PATH +
              `api/collection/importPostman?groups=${groupsArrayToStr(state.groups)}`,
            {
              method: 'POST',
              body: data,
            },
          );
        }
      } else {
        response = await fetch(BASE_PATH + 'api/collection', {
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

      <Collections collections={filteredCollections} />

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
