import { Box, Button, Heading } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';

import styles from './Header.module.css';

function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Box className={styles.container} bg="headerBg">
      <Heading as="h1" size="2xl">
        Yaade
      </Heading>
      <div className={styles.buttons}>
        <Button onClick={toggleColorMode}>
          {colorMode === 'light' ? 'Dark' : 'Light'}
        </Button>
      </div>
    </Box>
  );
}

export default Header;
