import { DeleteIcon } from '@chakra-ui/icons';
import {
  Checkbox,
  color,
  IconButton,
  Input,
  InputLeftElement,
  Select,
  Spinner,
  useColorMode,
} from '@chakra-ui/react';
import { history } from '@codemirror/commands';
import { drawSelection, EditorView } from '@codemirror/view';
import { useCodeMirror } from '@uiw/react-codemirror';
import React, { useEffect, useRef, useState } from 'react';
import { VscClose, VscCloudUpload } from 'react-icons/vsc';

import FileDescription from '../../model/FileDescription';
import { KVRowFile } from '../../model/KVRow';
import { cn } from '../../utils';
import {
  helpCursor,
  singleLineExtension,
  singleLineSetupOptions,
} from '../../utils/codemirror';
import { cursorTooltipBaseTheme, wordHover } from '../../utils/codemirror/envhover';
import { yaade } from '../../utils/codemirror/lang-yaade';
import {
  cmThemeDark,
  cmThemeLight,
  rawTheme,
  rawThemeDark,
} from '../../utils/codemirror/themes';
import FileSelectorModal from './FileSelectorModal';
import styles from './KVEditorRow.module.css';

const kvRowRawTheme = {
  ...rawThemeDark,
  '.cm-placeholder': {
    ...rawTheme['.cm-placeholder'],
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
  },
};

const rawLeftDark = {
  ...rawLeft,
  '&': {
    ...rawLeft['&'],
    border: '1px solid var(--chakra-colors-gray-700)',
    borderRight: '1px solid #2D3748',
  },
};

const rawLeftLight = {
  ...rawLeft,
  '&': {
    ...rawLeft['&'],
    border: '1px solid #EDF2F7',
  },
  '.cm-activeLine': {
    backgroundColor: 'white',
  },
};

const rawRight = {
  ...kvRowRawTheme,
  '&': {
    ...kvRowRawTheme['&'],
    width: '100%',
    minWidth: '100%',
    borderRadius: '0 20px 20px 0',
  },
};

const rawRightDark = {
  ...rawRight,
  '&': {
    ...rawRight['&'],
    border: '1px solid var(--chakra-colors-gray-700)',
    borderLeft: '1px solid #2D3748',
  },
};

const rawRightLight = {
  ...rawRight,
  '&': {
    ...rawRight['&'],
    border: '1px solid #EDF2F7',
  },
  '.cm-activeLine': {
    backgroundColor: 'white',
  },
};

const kvThemeLeftLight = EditorView.theme(rawLeftLight);
const kvThemeLeftDark = EditorView.theme(rawLeftDark);
const kvThemeRightLight = EditorView.theme(rawRightLight);
const kvThemeRightDark = EditorView.theme(rawRightDark);

type KVEditorRowProps = {
  i: number;
  name: string;
  kKey: string;
  value: string;
  isEnabled?: boolean;
  canDisableRow: boolean;
  onChangeRow: React.MutableRefObject<(i: number, param: string, value: any) => void>;
  onDeleteRow: React.MutableRefObject<(i: number) => void>;
  isDeleteDisabled?: boolean;
  isEnableDisabled?: boolean;
  readOnly?: boolean;
  hasEnvSupport: 'BOTH' | 'NONE' | 'VALUE_ONLY';
  env?: any;
  isMultipart: boolean;
  type: 'kv' | 'file';
  file?: KVRowFile;
  files?: FileDescription[];
};

function KVEditorRow({
  i,
  name,
  kKey,
  value,
  isEnabled = true,
  canDisableRow = false,
  onChangeRow,
  onDeleteRow,
  isDeleteDisabled,
  isEnableDisabled,
  readOnly,
  hasEnvSupport,
  env,
  isMultipart,
  type,
  file,
}: KVEditorRowProps) {
  const { colorMode } = useColorMode();
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);

  const leftref = useRef<HTMLDivElement>(null);
  const rightref = useRef<HTMLDivElement>(null);

  const extensionKeys = [singleLineExtension, history()];
  const extensionsValue = [singleLineExtension, history()];

  if (hasEnvSupport !== 'NONE') {
    const envExtensions = [];
    envExtensions.push(yaade(colorMode));
    envExtensions.push(wordHover(env?.data));
    envExtensions.push(helpCursor);
    envExtensions.push(cursorTooltipBaseTheme);
    if (hasEnvSupport === 'BOTH') {
      extensionKeys.push(...envExtensions);
      extensionsValue.push(...envExtensions);
    } else if (hasEnvSupport === 'VALUE_ONLY') {
      extensionsValue.push(...envExtensions);
    }
  }

  const { setContainer: setLeftContainer } = useCodeMirror({
    container: leftref.current,
    onChange: (key: string) => onChangeRow.current(i, 'key', key),
    extensions: [
      colorMode === 'light' ? kvThemeLeftLight : kvThemeLeftDark,
      ...extensionKeys,
      drawSelection(),
    ],
    theme: colorMode === 'light' ? cmThemeLight : cmThemeDark,
    value: kKey,
    style: { height: '100%' },
    placeholder: 'Key',
    indentWithTab: false,
    basicSetup: singleLineSetupOptions,
  });
  const { setContainer: setRightContainer } = useCodeMirror({
    container: rightref.current,
    onChange: (value: string) => onChangeRow.current(i, 'value', value),
    extensions: [
      colorMode === 'light' ? kvThemeRightLight : kvThemeRightDark,
      ...extensionsValue,
      drawSelection(),
    ],
    theme: colorMode === 'light' ? cmThemeLight : cmThemeDark,
    value,
    style: { height: '100%' },
    placeholder: 'Value',
    indentWithTab: false,
    basicSetup: singleLineSetupOptions,
  });

  useEffect(() => {
    if (leftref.current) {
      setLeftContainer(leftref.current);
    }
  }, [i, leftref, name, setLeftContainer]);

  useEffect(() => {
    if ((!isMultipart || type === 'kv') && rightref.current) {
      setRightContainer(rightref.current);
    } else if (type === 'file') {
      setRightContainer(undefined);
    }
  }, [i, name, rightref, setRightContainer, type, file, isMultipart]);

  const onSelectFile = (f: FileDescription) => {
    onChangeRow.current(i, 'file', { id: f.id, name: f.name });
    setIsFileSelectorOpen(false);
  };

  const unsetFile = () => {
    onChangeRow.current(i, 'file', undefined);
  };

  const unsetIfSame = (id: number) => {
    if (id === file?.id) {
      unsetFile();
    }
  };

  return (
    <div key={`${name}-${i}`} className={styles.row}>
      {!readOnly ? (
        <>
          <div className={styles.lrcontainer}>
            <div
              className={`${styles.cm} ${
                !isEnabled ? cn(styles, 'inputDisabled', [colorMode]) : ''
              }`}
              ref={leftref}
            />
            {!isMultipart || type === 'kv' ? (
              <div
                className={`${styles.cm} ${
                  !isEnabled ? cn(styles, 'inputDisabled', [colorMode]) : ''
                }`}
                ref={rightref}
              />
            ) : (
              <div
                className={cn(styles, 'fileSelector', [colorMode])}
                onClick={() => setIsFileSelectorOpen(true)}
                role="button"
                tabIndex={0}
                onKeyPress={() => setIsFileSelectorOpen(true)}
              >
                <div
                  className={styles.fileSelectorTextContainer}
                  style={{
                    color: isEnabled
                      ? (colorMode === 'light' && 'var(--chakra-colors-gray-600)') ||
                        'var(--chakra-colors-gray-400)'
                      : (colorMode === 'light' && 'rgba(0, 0, 0, 0.25)') ||
                        'rgba(255, 255, 255, 0.25)',
                  }}
                >
                  {file?.name ?? 'Select a File...'}
                </div>
                {file && (
                  <IconButton
                    marginRight="1rem"
                    size="xs"
                    aria-label="clear-file"
                    variant="ghost"
                    isRound
                    icon={<VscClose />}
                    onClick={(e) => {
                      e.stopPropagation();
                      unsetFile();
                    }}
                  />
                )}
              </div>
            )}
          </div>
          <div className={styles.btnContainer}>
            {isMultipart && (
              <Select
                ml="1rem"
                size="xs"
                width={75}
                minWidth={75}
                onChange={(e) => onChangeRow.current(i, 'type', e.target.value)}
                value={type}
              >
                <option value="kv">Text</option>
                <option value="file">File</option>
              </Select>
            )}
            {canDisableRow && (
              <Checkbox
                className={cn(styles, 'checkbox', [colorMode])}
                disabled={isEnableDisabled}
                isChecked={isEnabled}
                onChange={(e) => onChangeRow.current(i, 'isEnabled', e.target.checked)}
                colorScheme="green"
              />
            )}
            <IconButton
              aria-label="delete-row"
              isRound
              variant="ghost"
              disabled={isDeleteDisabled}
              onClick={() => onDeleteRow.current(i)}
              colorScheme="red"
              icon={<DeleteIcon />}
            />
          </div>
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
      {isFileSelectorOpen && (
        <FileSelectorModal
          isOpen={isFileSelectorOpen}
          onClose={() => setIsFileSelectorOpen(false)}
          onSelectFile={onSelectFile}
          unsetIfSame={unsetIfSame}
        />
      )}
    </div>
  );
}

export default React.memo(KVEditorRow);
