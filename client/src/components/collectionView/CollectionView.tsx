import {
  AddIcon,
  ChevronRightIcon,
  CopyIcon,
  DeleteIcon,
  EditIcon,
} from '@chakra-ui/icons';
import { IconButton, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { VscEllipsis } from 'react-icons/vsc';

import Collection from '../../model/Collection';
import { cn, getMethodColor } from '../../utils';
import styles from './CollectionView.module.css';

type CollectionProps = {
  collection: Collection;
  handleCollectionClick: any;
  handleRequestClick: any;
  onOpenCreateRequestModal: any;
};

function CollectionView({
  collection,
  handleCollectionClick,
  handleRequestClick,
  onOpenCreateRequestModal,
}: CollectionProps) {
  const variants = collection.open ? ['open'] : [];

  function handleOnKeyDown(e: any, action: any) {
    if (e.key === 'Enter') {
      action(e);
    }
  }

  return (
    <div className={styles.root}>
      <div
        className={cn(styles, 'header')}
        onClick={handleCollectionClick}
        onKeyDown={(e) => handleOnKeyDown(e, handleCollectionClick)}
        role="button"
        tabIndex={0}
      >
        <ChevronRightIcon className={cn(styles, 'icon', variants)} />
        <span className={styles.name}>{collection.name}</span>
        <span className={styles.actionIcon}>
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<VscEllipsis />}
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList zIndex={50}>
              <MenuItem
                icon={<AddIcon />}
                command="Cmd+T"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCreateRequestModal();
                }}
              >
                New Request
              </MenuItem>
              <MenuItem
                icon={<EditIcon />}
                command="Cmd+O"
                onClick={(e) => e.stopPropagation()}
              >
                Rename
              </MenuItem>
              <MenuItem
                icon={<DeleteIcon />}
                command="Cmd+O"
                onClick={(e) => e.stopPropagation()}
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </span>
      </div>
      <div className={cn(styles, 'requests', variants)}>
        {collection.requests.map((request) => {
          const reqVariants = request.selected ? ['selected'] : [];
          return (
            <div
              className={cn(styles, 'request', reqVariants)}
              key={`request-${request.id}`}
              onClick={() => handleRequestClick(request)}
              onKeyDown={(e) => handleOnKeyDown(e, () => handleRequestClick(request))}
              role="button"
              tabIndex={0}
            >
              <span
                className={cn(styles, 'requestMethod')}
                style={getMethodColor(request.method)}
              >
                {request.method}
              </span>
              <span className={cn(styles, 'requestName')}>{request.name}</span>
              <span className={styles.actionIcon}>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="Options"
                    icon={<VscEllipsis />}
                    variant="ghost"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <MenuList zIndex={50}>
                    <MenuItem
                      icon={<EditIcon />}
                      command="Cmd+O"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Rename
                    </MenuItem>
                    <MenuItem
                      icon={<CopyIcon />}
                      command="Cmd+O"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Duplicate
                    </MenuItem>
                    <MenuItem
                      icon={<DeleteIcon />}
                      command="Cmd+O"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Delete
                    </MenuItem>
                  </MenuList>
                </Menu>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CollectionView;
