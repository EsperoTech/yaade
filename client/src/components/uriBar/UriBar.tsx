import { Spinner, useColorMode } from '@chakra-ui/react';
import { drawSelection } from '@codemirror/view';
import { EditorView } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import { FormEvent, useEffect, useRef } from 'react';

import { cn } from '../../utils';
import { helpCursor, singleLine } from '../../utils/codemirror';
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
  env: any;
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
  env,
}: UriBarProps) {
  const { colorMode } = useColorMode();
  const ref = useRef<HTMLDivElement>(null);

  const eventHandlers = EditorView.domEventHandlers({
    paste(event) {
      if (!event.target || !event.clipboardData) {
        return;
      }
      // differenciates between initial and synthetic event to prevent infinite loop
      if (!event.isTrusted) {
        return;
      }
      event.preventDefault();

      const text = event.clipboardData.getData('text/plain');
      const sanitized = text.replace(/(\r\n|\n|\r)/gm, '');

      const data = new DataTransfer();
      data.setData('text/plain', sanitized);
      const sanitizedEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clipboardData: data,
      });

      event.target?.dispatchEvent(sanitizedEvent);
    },
  });

  const { setContainer } = useCodeMirror({
    container: ref.current,
    onChange: (value: string) => setUri(value),
    extensions: [
      yaade(colorMode),
      colorMode === 'light' ? baseThemeLight : baseThemeDark,
      singleLine,
      wordHover(env?.data),
      helpCursor,
      cursorTooltipBaseTheme,
      drawSelection(),
      eventHandlers,
    ],
    theme: colorMode === 'light' ? cmThemeLight : cmThemeDark,
    value: uri,
    style: { height: '100%' },
    placeholder: 'URL',
    indentWithTab: false,
    basicSetup: false,
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
