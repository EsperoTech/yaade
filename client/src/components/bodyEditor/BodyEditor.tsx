import { useColorMode } from '@chakra-ui/react';
import { json } from '@codemirror/lang-json';
import CodeMirror from '@uiw/react-codemirror';

import styles from './BodyEditor.module.css';

type BodyEditorProps = {
  content: string;
  setContent: any;
};

function BodyEditor({ content, setContent }: BodyEditorProps) {
  const { colorMode } = useColorMode();
  return (
    <div className={styles.container}>
      <CodeMirror
        onChange={(value) => {
          setContent(value);
        }}
        extensions={[json()]}
        theme={colorMode}
        value={content}
        style={{ height: '100%' }}
      />
    </div>
  );
}

export default BodyEditor;
