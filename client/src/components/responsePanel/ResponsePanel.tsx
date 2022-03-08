import { Box } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

import Response from '../../model/Response';
import styles from './ResponsePanel.module.css';

type ResponsePanelProps = {
  response?: Response;
};

function ResponsePanel({ response }: ResponsePanelProps) {
  const colorMode = useColorMode();

  return (
    <Box className={styles.container} bg="panelBg">
      {response ? (
        <CodeMirror
          height="100%"
          onChange={(value) => {}}
          extensions={[json()]}
          theme={colorMode.colorMode}
          value={response.body}
          editable={false}
        />
      ) : null}
    </Box>
  );
}

export default ResponsePanel;
