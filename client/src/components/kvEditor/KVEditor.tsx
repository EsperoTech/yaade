import { DeleteIcon } from '@chakra-ui/icons';
import { IconButton } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';

import KVRow from '../../model/KVRow';
import styles from './KVEditor.module.css';

type KVEditorProps = {
  kvs: Array<KVRow>;
  setKvs?: any;
  name: string;
  readOnly?: boolean;
};

function KVEditor({ name, kvs, setKvs, readOnly }: KVEditorProps) {
  const { colorMode } = useColorMode();

  const onChangeRow = (i: number, param: string, e: any) => {
    const newKvs = [...kvs];
    const newRow = { ...newKvs[i] } as any;
    const oldParam = newRow[param];
    newRow[param] = e.target.value;
    newKvs[i] = newRow;

    if (i === newKvs.length - 1 && oldParam === '') {
      newKvs.push({
        key: '',
        value: '',
      });
    }

    setKvs(newKvs);
  };

  const onDeleteRow = (i: number) => {
    const newKvs = [...kvs];
    newKvs.splice(i, 1);
    setKvs(newKvs);
  };

  return (
    <div className={styles.container}>
      {kvs.map(({ key, value }, i: number) => (
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
              disabled={i === 0 && kvs.length === 1}
              onClick={() => onDeleteRow(i)}
              color={colorMode === 'light' ? 'red.500' : 'red.300'}
              icon={<DeleteIcon />}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default KVEditor;
