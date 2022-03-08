import { AddIcon, ChevronRightIcon, EditIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from '@chakra-ui/react';

import Collection from '../../model/Collection';
import { cn } from '../../utils';
import styles from './CollectionView.module.css';

type CollectionProps = {
  collection: Collection;
  handleCollectionClick: any;
  handleRequestClick: any;
};

function getMethodStyle(method: string): any {
  switch (method) {
    case 'GET':
      return {
        color: 'var(--chakra-colors-green-500)',
      };
  }
}

function CollectionView({
  collection,
  handleCollectionClick,
  handleRequestClick,
}: CollectionProps) {
  const variants = collection.open ? ['open'] : [];

  function handleOnKeyDown(e: any, action: any) {
    if (e.key === 'Enter') {
      action(e);
    }
  }

  return (
    <div>
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
              icon={<HamburgerIcon />}
              variant="ghost"
              onClick={(e) => e.stopPropagation()}
            />
            <MenuList zIndex={50}>
              <MenuItem icon={<AddIcon />} command="Cmd+T">
                New Tab
              </MenuItem>
              <MenuItem icon={<EditIcon />} command="Cmd+O">
                Rename
              </MenuItem>
            </MenuList>
          </Menu>
        </span>
      </div>
      <div className={cn(styles, 'requests', variants)}>
        {collection.requests.map((request) => (
          <div
            className={cn(styles, 'request')}
            key={`request-${request.id}`}
            onClick={() => handleRequestClick(request)}
            onKeyDown={(e) => handleOnKeyDown(e, () => handleRequestClick(request))}
            role="button"
            tabIndex={0}
          >
            <span
              className={cn(styles, 'requestMethod')}
              style={getMethodStyle(request.method)}
            >
              {request.method}
            </span>
            <span className={cn(styles, 'requestName')}>{request.name}</span>
            <span className={styles.actionIcon}>
              <Menu>
                <MenuButton
                  as={IconButton}
                  aria-label="Options"
                  icon={<HamburgerIcon />}
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                />
                <MenuList zIndex={50}>
                  <MenuItem icon={<AddIcon />} command="Cmd+T">
                    New Tab
                  </MenuItem>
                  <MenuItem icon={<EditIcon />} command="Cmd+O">
                    Rename
                  </MenuItem>
                </MenuList>
              </Menu>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CollectionView;
