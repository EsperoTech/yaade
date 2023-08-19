import { DeleteIcon } from '@chakra-ui/icons';
import { IconButton, useColorMode } from '@chakra-ui/react';
import { EditorView } from '@codemirror/view';
import ReactCodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import { helpCursor, singleLine } from '../../utils/codemirror';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { json } from '../../utils/codemirror/lang-json';
import { yaade } from '../../utils/codemirror/lang-yaade';
import { cmTheme, rawTheme } from '../../utils/codemirror/themes';
import styles from './KVEditorRow.module.css';

const kvRowRawTheme = {
  ...rawTheme,
  '.cm-placeholder': {
    ...rawTheme['.cm-placeholder'],
    color: '#4e5057',
    lineHeight: '38px',
  },
  '.cm-content': {
    ...rawTheme['.cm-content'],
    minHeight: '38px',
    height: '38px',
  },
  '.cm-line': {
    ...rawTheme['.cm-line'],
    lineHeight: '2.4',
    paddingLeft: '1rem',
    paddingRight: '1rem',
  },
};

const rawLeft = {
  ...kvRowRawTheme,
  '&': {
    ...kvRowRawTheme['&'],
    width: '100%',
    minWidth: '100%',
    borderRadius: '20px 0 0 20px',
    borderRight: '1px solid #2D3748',
  },
};

const rawRight = {
  ...kvRowRawTheme,
  '&': {
    ...kvRowRawTheme['&'],
    width: '100%',
    minWidth: '100%',
    borderRadius: '0 20px 20px 0',
    borderLeft: '1px solid #2D3748',
  },
};

const kvThemeLeft = EditorView.theme(rawLeft);
const kvThemeRight = EditorView.theme(rawRight);

type KVEditorRowProps = {
  i: number;
  name: string;
  kKey: string;
  value: string;
  onChangeRow: React.MutableRefObject<(i: number, param: string, value: string) => void>;
  onDeleteRow: React.MutableRefObject<(i: number) => void>;
  isDeleteDisabled?: boolean;
  readOnly?: boolean;
  hasEnvSupport: boolean;
  env?: any;
};

function KVEditorRow({
  i,
  name,
  kKey,
  value,
  onChangeRow,
  onDeleteRow,
  isDeleteDisabled,
  readOnly,
  hasEnvSupport,
  env,
}: KVEditorRowProps) {
  const { colorMode } = useColorMode();

  const leftref = useRef<HTMLDivElement>(null);
  const rightref = useRef<HTMLDivElement>(null);

  const extensions = [singleLine];

  if (hasEnvSupport) {
    extensions.push(yaade());
    extensions.push(wordHover(env?.data));
    extensions.push(helpCursor);
    extensions.push(cursorTooltipBaseTheme);
  }

  const { setContainer: setLeftContainer } = useCodeMirror({
    container: leftref.current,
    onChange: (key: string) => onChangeRow.current(i, 'key', key),
    extensions: [kvThemeLeft, ...extensions],
    theme: cmTheme,
    value: kKey,
    style: { height: '100%' },
    placeholder: 'Key',
    indentWithTab: false,
  });
  const { setContainer: setRightContainer } = useCodeMirror({
    container: rightref.current,
    onChange: (value: string) => onChangeRow.current(i, 'value', value),
    extensions: [kvThemeRight, ...extensions],
    theme: cmTheme,
    value,
    style: { height: '100%' },
    placeholder: 'Value',
    indentWithTab: false,
  });

  useEffect(() => {
    console.log('leftref.current', leftref.current, name, i);
    if (leftref.current) {
      setLeftContainer(leftref.current);
    }
  }, [i, leftref, name, setLeftContainer]);

  useEffect(() => {
    console.log('rightref.current', rightref.current, name, i);
    if (rightref.current) {
      setRightContainer(rightref.current);
    }
  }, [i, name, rightref, setRightContainer]);

  return (
    <div key={`${name}-${i}`} className={styles.row}>
      {!readOnly ? (
        <>
          <div className={styles.cm} ref={leftref} />
          <div className={styles.cm} ref={rightref} />
          <IconButton
            aria-label="delete-row"
            isRound
            variant="ghost"
            disabled={isDeleteDisabled}
            onClick={() => onDeleteRow.current(i)}
            colorScheme="red"
            icon={<DeleteIcon />}
          />
        </>
      ) : (
        <>
          <input
            className={`${styles.input} ${styles['input--left']} ${
              styles[`input--${colorMode}`]
            }`}
            placeholder="Key"
            value={kKey}
            readOnly={readOnly}
          />

          <input
            className={`${styles.input} ${styles['input--right']} ${
              styles[`input--${colorMode}`]
            }`}
            placeholder="Value"
            value={value}
            readOnly={readOnly}
          />
        </>
      )}
    </div>
  );
}

export default React.memo(KVEditorRow);
// export default React.memo(KVEditorRow, (prevProps, nextProps) => {
//   console.log(
//     'prevProps.kKey === nextProps.kKey',
//     prevProps.kKey === nextProps.kKey,
//     'prevProps.value === nextProps.value',
//     prevProps.value === nextProps.value,
//     'prevProps.setKey === nextProps.setKey',
//     prevProps.setKey === nextProps.setKey,
//     'prevProps.setValue === nextProps.setValue',
//     prevProps.setValue === nextProps.setValue,
//     'prevProps.onDeleteRow === nextProps.onDeleteRow',
//     prevProps.onDeleteRow === nextProps.onDeleteRow,
//     'prevProps.isDeleteDisabled === nextProps.isDeleteDisabled',
//     prevProps.isDeleteDisabled === nextProps.isDeleteDisabled,
//     'prevProps.readOnly === nextProps.readOnly',
//     prevProps.readOnly === nextProps.readOnly,
//   );
//   return (
//     prevProps.kKey === nextProps.kKey &&
//     prevProps.value === nextProps.value &&
//     prevProps.setKey === nextProps.setKey &&
//     prevProps.setValue === nextProps.setValue &&
//     prevProps.onDeleteRow === nextProps.onDeleteRow &&
//     prevProps.isDeleteDisabled === nextProps.isDeleteDisabled &&
//     prevProps.readOnly === nextProps.readOnly
//   );
// });
