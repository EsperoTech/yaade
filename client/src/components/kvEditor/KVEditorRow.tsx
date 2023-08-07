import { DeleteIcon } from '@chakra-ui/icons';
import { IconButton, useColorMode } from '@chakra-ui/react';
import { EditorView } from '@codemirror/view';
import ReactCodeMirror, { useCodeMirror } from '@uiw/react-codemirror';
import React, { useEffect, useMemo, useRef } from 'react';

import { cmTheme } from '../../utils/codemirror/themes';
import editor from '../editor';
import styles from './KVEditorRow.module.css';

const rawTheme = {
  '&': {
    color: '#000',
    boxSizing: 'border-box',
    border: '1px solid var(--chakra-colors-gray-700)',
    backgroundColor: '--var(--chakra-colors-gray-900)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    height: 'auto', // Set height to auto
    overflow: 'hidden', // Hide overflowed content
  },
  '&.cm-focused': {
    outline: '1px solid #38A169 !important',
    outlineOffset: '-1px',
  },
  '.cm-activeLine': {
    // minHeight: '100%',
    // height: '100%',
    // transparency: '100%',
    // 'background-color': '#171923 !important',
  },
  '.cm-focused .cm-selectionBackground, ::selection': {
    // backgroundColor: 'red !important',
  },
  '.cm-line::selection': {
    // backgroundColor: 'red !important',
  },
  '.cm-cursor': {
    borderLeft: '1px solid #000',
  },
  '.cm-placeholder': {
    color: '#4e5057',
    lineHeight: '38px',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-linenumber': {
    display: 'none',
  },
  '.cm-content': {
    minHeight: '38px',
    height: '38px',
    padding: '0',
    boxSizing: 'border-box',
    // backgroundColor: '#171923',
    margin: 'auto',
    verticalAlign: 'middle',
    // caretColor: 'white !important',
    // color: 'white',
  },
  '.cm-content, .cm-gutter': { minHeight: '30px' },
  '.cm-scrollbar': {
    display: 'none',
  },
  '.cm-scroller': {
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
  },
  '.cm-activeLineGutter': {
    display: 'none',
  },
  '.cm-line': {
    paddingLeft: '1rem',
    paddingRight: '1rem',
    minHeight: '30px',
    height: '30px',
    boxSizing: 'border-box',
    // backgroundColor: '#171923',
    display: 'flex',
    alignItems: 'start',
    justifyContent: 'start',
    lineHeight: '2.27', // Adjust line height for better vertical alignment
  },
};

const rawLeft = {
  ...rawTheme,
  '&': {
    ...rawTheme['&'],
    width: '100%',
    minWidth: '100%',
    borderRadius: '20px 0 0 20px',
    borderRight: '1px solid #2D3748',
  },
};

const rawRight = {
  ...rawTheme,
  '&': {
    ...rawTheme['&'],
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
  setKey: (i: number, key: string) => void;
  setValue: (i: number, value: string) => void;
  onDeleteRow: (i: number) => void;
  isDeleteDisabled?: boolean;
  readOnly?: boolean;
};

function KVEditorRow({
  i,
  name,
  kKey,
  value,
  setKey,
  setValue,
  onDeleteRow,
  isDeleteDisabled,
  readOnly,
}: KVEditorRowProps) {
  const { colorMode } = useColorMode();

  const leftref = useRef<HTMLDivElement>(null);
  const rightref = useRef<HTMLDivElement>(null);

  const { setContainer: setLeftContainer } = useCodeMirror({
    container: leftref.current,
    onChange: (key: string) => setKey(i, key),
    extensions: [kvThemeLeft],
    theme: cmTheme,
    value: kKey,
    style: { height: '100%' },
    placeholder: 'Key',
  });
  const { setContainer: setRightContainer } = useCodeMirror({
    container: rightref.current,
    onChange: (value: string) => setValue(i, value),
    extensions: [kvThemeRight],
    theme: cmTheme,
    value,
    style: { height: '100%' },
    placeholder: 'Value',
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
            onClick={() => onDeleteRow(i)}
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

export default React.memo(KVEditorRow, (prevProps, nextProps) => {
  console.log(
    'prevProps.kKey === nextProps.kKey',
    prevProps.kKey === nextProps.kKey,
    'prevProps.value === nextProps.value',
    prevProps.value === nextProps.value,
    'prevProps.setKey === nextProps.setKey',
    prevProps.setKey === nextProps.setKey,
    'prevProps.setValue === nextProps.setValue',
    prevProps.setValue === nextProps.setValue,
    'prevProps.onDeleteRow === nextProps.onDeleteRow',
    prevProps.onDeleteRow === nextProps.onDeleteRow,
    'prevProps.isDeleteDisabled === nextProps.isDeleteDisabled',
    prevProps.isDeleteDisabled === nextProps.isDeleteDisabled,
    'prevProps.readOnly === nextProps.readOnly',
    prevProps.readOnly === nextProps.readOnly,
  );
  return (
    prevProps.kKey === nextProps.kKey &&
    prevProps.value === nextProps.value &&
    prevProps.setKey === nextProps.setKey &&
    prevProps.setValue === nextProps.setValue &&
    prevProps.onDeleteRow === nextProps.onDeleteRow &&
    prevProps.isDeleteDisabled === nextProps.isDeleteDisabled &&
    prevProps.readOnly === nextProps.readOnly
  );
});
