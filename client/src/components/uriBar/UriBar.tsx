import { Spinner, useColorMode } from '@chakra-ui/react';
import { FormEvent } from 'react';

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
      <input
        className={cn(styles, 'input', [colorMode])}
        type="text"
        placeholder="URL"
        value={uri}
        onChange={(e) => setUri(e.target.value)}
      />
      <button
        className={cn(styles, 'button', [colorMode])}
        disabled={uri === ''}
        type="submit"
      >
        {isLoading ? <Spinner size="sm" /> : 'SEND'}
      </button>
    </form>
  );
}

export default UriBar;
