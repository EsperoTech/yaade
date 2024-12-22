import { Spinner, useColorMode } from '@chakra-ui/react';
import { history } from '@codemirror/commands';
import { drawSelection } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import { FormEvent, useEffect, useRef } from 'react';

import { cn } from '../../utils';
import {
  helpCursor,
  singleLineExtension,
  singleLineSetupOptions,
} from '../../utils/codemirror';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { yaade } from '../../utils/codemirror/lang-yaade';
import {
  baseThemeDark,
  baseThemeLight,
  cmThemeDark,
  cmThemeLight,
} from '../../utils/codemirror/themes';
import styles from './UriBar.module.css';

type UriBarProps = {
  uri: string;
  setUri: any;
  method: string;
  setMethod: any;
  isLoading: boolean;
  handleSendButtonClick: () => void;
  envData: Record<string, string>;
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
  envData,
}: UriBarProps) {
  const { colorMode } = useColorMode();
  const ref = useRef<HTMLDivElement>(null);

  console.log('env', envData);

  const { setContainer } = useCodeMirror({
    container: ref.current,
    onChange: (value: string) => setUri(value),
    extensions: [
      yaade(colorMode),
      colorMode === 'light' ? baseThemeLight : baseThemeDark,
      singleLineExtension,
      history(),
      wordHover(envData),
      helpCursor,
      cursorTooltipBaseTheme,
      drawSelection(),
    ],
    theme: colorMode === 'light' ? cmThemeLight : cmThemeDark,
    value: uri,
    style: { height: '100%' },
    placeholder: 'URL',
    indentWithTab: false,
    basicSetup: singleLineSetupOptions,
  });

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref, setContainer]);

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
    <div style={{ width: 'calc(100% - 40px)' }}>
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
        <div className={styles.cm} ref={ref} />
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
