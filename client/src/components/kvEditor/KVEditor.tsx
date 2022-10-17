import { DeleteIcon } from '@chakra-ui/icons';
import { IconButton } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';
import React from 'react';

import KVRow from '../../model/KVRow';
import styles from './KVEditor.module.css';

type KVEditorProps = {
  kvs: Array<KVRow>;
  setKvs?: any;
  name: string;
  readOnly?: boolean;
};

const EMPTY_ROW = { key: '', value: '' };
const isRowEmpty = (row: KVRow) => row.key === '' && row.value === '';

function KVEditor({ name, kvs, setKvs, readOnly }: KVEditorProps) {
  const { colorMode } = useColorMode();

  console.log('rerender kv', kvs);

  const displayKvs = kvs ? [...kvs] : [];

  if (
    !readOnly &&
    (displayKvs.length === 0 || !isRowEmpty(displayKvs[displayKvs.length - 1]))
  ) {
    displayKvs.push({ ...EMPTY_ROW });
  }

  const onChangeRow = (i: number, param: string, e: any) => {
    let newKvs = [...displayKvs];
    const newRow = { ...newKvs[i] } as any;
    newRow[param] = e.target.value;
    newKvs[i] = newRow;
    newKvs = newKvs.filter((el) => !isRowEmpty(el));

    setKvs(newKvs);
  };

  const onDeleteRow = (i: number) => {
    let newKvs = [...displayKvs];
    newKvs.splice(i, 1);
    newKvs = newKvs.filter((el) => !isRowEmpty(el));
    setKvs(newKvs);
  };

  return (
    <div className={styles.container}>
      {displayKvs.map(({ key, value }, i) => (
        <div key={`${name}-${i}`} className={styles.row}>
          <input
            className={`${styles.input} ${styles['input--left']} ${
              styles[`input--${colorMode}`]
            }`}
            onChange={(e) => onChangeRow(i, 'key', e)}
            placeholder="Key"
            value={key}
            readOnly={readOnly}
          />
          <input
            className={`${styles.input} ${styles['input--right']} ${
              styles[`input--${colorMode}`]
            }`}
            onChange={(e) => onChangeRow(i, 'value', e)}
            placeholder="Value"
            value={value}
            readOnly={readOnly}
          />
          {readOnly ? null : (
            <IconButton
              aria-label="delete-row"
              isRound
              variant="ghost"
              disabled={i === displayKvs.length - 1}
              onClick={() => onDeleteRow(i)}
              colorScheme="red"
              icon={<DeleteIcon />}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default React.memo(KVEditor);
