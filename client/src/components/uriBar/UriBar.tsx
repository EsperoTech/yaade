import { Spinner, useColorMode } from '@chakra-ui/react';

import { cn } from '../../utils';
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
  colorMode: string;
};

function MethodOption({ method, colorMode }: MethodOptionProps) {
  return (
    <option className={cn(styles, 'option', [colorMode])} value={method}>
      {method}
    </option>
  );
}

function UriBar({
  uri,
  setUri,
  method,
  setMethod,
  isLoading,
  handleSendButtonClick,
}: UriBarProps) {
  const { colorMode } = useColorMode();
  return (
    <div className={styles.container}>
      <select
        className={cn(styles, 'select', [colorMode])}
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      >
        <MethodOption method="GET" colorMode={colorMode} />
        <MethodOption method="POST" colorMode={colorMode} />
        <MethodOption method="PUT" colorMode={colorMode} />
        <MethodOption method="DELETE" colorMode={colorMode} />
      </select>
      <input
        className={cn(styles, 'input', [colorMode])}
        type="text"
        placeholder="URL"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button
        className={cn(styles, 'button', [colorMode])}
        onClick={handleSendButtonClick}
        disabled={uri === ''}
      >
        {isLoading ? <Spinner size="sm" /> : 'SEND'}
      </button>
    </div>
  );
}

export default UriBar;
