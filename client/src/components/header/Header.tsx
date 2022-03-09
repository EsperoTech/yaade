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

type HeaderProps = {
  settings: any;
  setSettings: any;
};

function Header({ settings, setSettings }: HeaderProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <Box className={styles.container} bg="headerBg">
      <Heading as="h1" size="2xl">
        Yaade
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
          <Settings settings={settings} setSettings={setSettings} />
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default Header;
