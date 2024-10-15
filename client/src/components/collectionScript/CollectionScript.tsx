import { CopyIcon, DeleteIcon, EditIcon, LinkIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useClipboard,
  useColorMode,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { Dispatch, FunctionComponent } from 'react';
import { useRef, useState } from 'react';
import { VscEllipsis, VscFileCode, VscFolderOpened } from 'react-icons/vsc';

import { SidebarScript } from '../../model/Script';
import { CollectionsAction } from '../../state/collections';
import { successToast } from '../../utils';
import { cn, getMethodColor } from '../../utils';
import BasicModal from '../basicModal';
import styles from './CollectionScript.module.css';

type CollectionScriptProps = {
  script: SidebarScript;
  selected: boolean;
  selectScript: any;
  depth: number;
  dispatchCollections: Dispatch<CollectionsAction>;
  deleteScript: (id: number) => void;
  duplicateScript: (id: number, newName: string) => void;
  takeOwnership: (id: number) => void;
};

type CollectionScriptState = {
  name: string;
  currentModal: string;
};

function handleOnKeyDown(e: any, action: any) {
  if (e.key === 'Enter') {
    action(e);
  }
}

const CollectionScript: FunctionComponent<CollectionScriptProps> = ({
  script,
  selected,
  depth,
  selectScript,
  deleteScript,
  duplicateScript,
  takeOwnership,
}) => {
  const [state, setState] = useState<CollectionScriptState>({
    name: script.name,
    currentModal: '',
  });

  const initialRef = useRef(null);
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { onCopy } = useClipboard(
    `${window.location.origin}/#/${script.collectionId}/s-${script.id}`,
  );
  const { onCopy: onCopyScriptId } = useClipboard(`${script.id}`);
  const variants = selected ? ['selected'] : [];

  function onCloseClear() {
    setState({ ...state, name: script.name });
    onClose();
  }

  const deleteModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Delete "${script.name}"`}
      onClick={() => {
        deleteScript(script.id);
        onCloseClear();
      }}
      buttonText="Delete"
      buttonColor="red"
      isButtonDisabled={false}
    >
      Are you sure you want to delete this script?
      <br />
      The script cannot be recovered!
    </BasicModal>
  );

  const duplicateModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Duplicate "${script.name}"`}
      onClick={() => {
        duplicateScript(script.id, state.name);
        onCloseClear();
      }}
      buttonText="Duplicate"
      buttonColor="green"
      isButtonDisabled={false}
    >
      <Input
        placeholder="Name"
        w="100%"
        borderRadius={20}
        colorScheme="green"
        backgroundColor={colorMode === 'light' ? 'white' : undefined}
        value={state.name}
        onChange={(e) => setState({ ...state, name: e.target.value })}
        ref={initialRef}
      />
    </BasicModal>
  );

  const takeOwnershipModal = (
    <BasicModal
      isOpen={isOpen}
      initialRef={undefined}
      onClose={onCloseClear}
      heading={`Take ownership of "${script.name}"`}
      onClick={() => {
        takeOwnership(script.id);
        onCloseClear();
      }}
      buttonText="Take Ownership"
      buttonColor="green"
      isButtonDisabled={false}
    >
      Are you sure you want to take ownership of this script?
      <br />
      Every subsequent Cron run will be executed by your user.
    </BasicModal>
  );

  let currentModal;

  if (state.currentModal === 'delete') {
    currentModal = deleteModal;
  } else if (state.currentModal === 'duplicate') {
    currentModal = duplicateModal;
  } else if (state.currentModal === 'takeOwnership') {
    currentModal = takeOwnershipModal;
  }

  return (
    <div
      className={cn(styles, 'script', [...variants, colorMode])}
      onClick={() => selectScript.current(script.id)}
      onKeyDown={(e) => handleOnKeyDown(e, () => selectScript.current(script.id))}
      role="button"
      tabIndex={0}
    >
      {Array(depth + 1).fill(<div className={styles.line} />)}
      <div className={styles.iconWrapper}>
        <VscFileCode className={cn(styles, 'icon', [colorMode])} />
      </div>
      <span className={cn(styles, 'scriptName', [colorMode])}>{script.name}</span>
      <span className={styles.actionIcon}>
        <Menu>
          {({ isOpen }) => (
            <>
              <MenuButton
                as={IconButton}
                aria-label="Options"
                icon={<VscEllipsis />}
                variant="ghost"
                onClick={(e) => e.stopPropagation()}
              />
              <MenuList
                zIndex={50}
                style={{
                  // this is a workaround to fix drag and drop preview not working
                  // see: https://github.com/chakra-ui/chakra-ui/issues/6762
                  display: isOpen ? '' : 'none',
                }}
              >
                <MenuItem
                  icon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({ ...state, currentModal: 'rename', name: script.name });
                    onOpen();
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  icon={<CopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({
                      ...state,
                      currentModal: 'duplicate',
                      name: `${script.name} (copy)`,
                    });
                    onOpen();
                  }}
                >
                  Duplicate
                </MenuItem>
                <MenuItem
                  icon={<CopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({
                      ...state,
                      currentModal: 'takeOwnership',
                    });
                    onOpen();
                  }}
                >
                  Take Ownership
                </MenuItem>
                <MenuItem
                  icon={<LinkIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                    successToast('Link copied to clipboard.', toast);
                  }}
                >
                  Copy Link
                </MenuItem>
                <MenuItem
                  icon={<CopyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyScriptId();
                    successToast('Script ID copied to clipboard.', toast);
                  }}
                >
                  Copy ID
                </MenuItem>
                <MenuItem
                  icon={<DeleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setState({ ...state, currentModal: 'delete' });
                    onOpen();
                  }}
                >
                  Delete
                </MenuItem>
              </MenuList>
            </>
          )}
        </Menu>
      </span>
      {currentModal}
    </div>
  );
};

export default CollectionScript;
