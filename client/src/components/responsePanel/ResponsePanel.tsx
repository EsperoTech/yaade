import { Box } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

import styles from './ResponsePanel.module.css';

function ResponsePanel() {
  const colorMode = useColorMode();

  return (
    <Box className={styles.container} bg="panelBg">
      <CodeMirror
        height="100%"
        onChange={(value) => {
          console.log('value:', value);
        }}
        extensions={[json()]}
        theme={colorMode.colorMode}
      />
    </Box>
  );
}

export default ResponsePanel;
