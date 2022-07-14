import { SettingsIcon } from '@chakra-ui/icons';
import {
  Box,
  Heading,
  IconButton,
  Modal,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/react';
import { useDisclosure } from '@chakra-ui/react';

import Settings from '../settings';
import styles from './Header.module.css';

function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box
      className={styles.container}
      bg="headerBg"
      borderBottom="1px"
      borderColor="rgba(128, 128, 128, 0.35)"
    >
      <img className={styles.img} src="yaade-icon.png" alt="yaade icon" />
      <Heading as="h1" size="md" ml="2">
        YAADE
      </Heading>
      <div className={styles.buttons}>
        <IconButton
          aria-label="settings-button"
          icon={<SettingsIcon />}
          onClick={onOpen}
          variant="ghost"
        ></IconButton>
      </div>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent width="" maxWidth="" borderRadius={20} padding={2}>
          <Settings />
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Header;
