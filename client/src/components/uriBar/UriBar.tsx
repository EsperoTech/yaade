import { Spinner, useColorMode } from '@chakra-ui/react';
import { javascript } from '@codemirror/lang-javascript';
import { createTheme } from '@uiw/codemirror-themes';
import CodeMirror from '@uiw/react-codemirror';
import { FormEvent } from 'react';

import { cn } from '../../utils';
import { baseTheme, cmTheme } from '../../utils/codemirror/themes';
import styles from './UriBar.module.css';

type UriBarProps = {
  uri: string;
  setUri: any;
  method: string;
  setMethod: any;
  isLoading: boolean;
  handleSendButtonClick: () => void;
};

type MethodOptionProps = {
  method: string;
};

function UriBar({
  uri,
  setUri,
  method,
  setMethod,
  isLoading,
  handleSendButtonClick,
}: UriBarProps) {
  const { colorMode } = useColorMode();

  const extensions = [baseTheme];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (uri === '') return;
    handleSendButtonClick();
  }

  function MethodOption({ method }: MethodOptionProps) {
    return (
      <option className={cn(styles, 'option', [colorMode])} value={method}>
        {method}
      </option>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <form className={styles.container} onSubmit={handleSubmit}>
        <select
          className={cn(styles, 'select', [colorMode])}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          <MethodOption method="GET" />
          <MethodOption method="POST" />
          <MethodOption method="PUT" />
          <MethodOption method="DELETE" />
          <MethodOption method="HEAD" />
          <MethodOption method="OPTIONS" />
          <MethodOption method="PATCH" />
          <MethodOption method="CONNECT" />
          <MethodOption method="TRACE" />
        </select>
        <CodeMirror
          className={styles.cm}
          onChange={setUri}
          extensions={extensions}
          theme={cmTheme}
          value={uri}
          style={{ height: '100%' }}
          placeholder="URL"
        />
        <button
          className={cn(styles, 'button', [colorMode])}
          disabled={uri === ''}
          type="submit"
        >
          {isLoading ? <Spinner size="sm" /> : 'SEND'}
        </button>
      </form>
    </div>
  );
}

export default UriBar;
