import { Box } from '@chakra-ui/react';
import { ResizableBox } from 'react-resizable';

import styles from './Sidebar.module.css';

function Sidebar() {
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

  return (
    <ResizableBox
      className={styles.container}
      width={200}
      height={200}
      maxConstraints={[vw * 0.9, Infinity]}
      axis="x"
      handle={<span className={`${styles.handle} ${styles.handleE}`} />}
      handleSize={[8, 8]}
    >
      <Box className={styles.box} bg="panelBg" h="100%" w="100%"></Box>
    </ResizableBox>
  );
}

export default Sidebar;
