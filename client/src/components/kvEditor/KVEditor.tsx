import { useCallback, useMemo } from 'react';

import KVRow from '../../model/KVRow';
import styles from './KVEditor.module.css';
import KVEditorRow from './KVEditorRow';

type KVEditorProps = {
  kvs: Array<KVRow>;
  setKvs?: any;
  name: string;
  readOnly?: boolean;
};

const EMPTY_ROW = { key: '', value: '' };
const isRowEmpty = (row: KVRow) => row.key === '' && row.value === '';

function KVEditor({ name, kvs, setKvs, readOnly }: KVEditorProps) {
  // we copy the data so we can append an empty last row without
  // mutating the original data
  const displayKvs = useMemo(() => {
    const result = kvs ? [...kvs] : [];
    if (!readOnly && (result.length === 0 || !isRowEmpty(result[result.length - 1]))) {
      result.push({ ...EMPTY_ROW });
    }
    return result;
  }, [kvs, readOnly]);

  const onChangeRow = useCallback(
    (i: number, param: string, value: string) => {
      let newKvs = [...displayKvs];
      const newRow = { ...newKvs[i] } as any;
      newRow[param] = value;
      newKvs[i] = newRow;
      newKvs = newKvs.filter((el) => !isRowEmpty(el));

      setKvs(newKvs);
    },
    [displayKvs, setKvs],
  );

  const setKey = useCallback(
    (i: number, key: string) => onChangeRow(i, 'key', key),
    [onChangeRow],
  );
  const setValue = useCallback(
    (i: number, value: string) => onChangeRow(i, 'value', value),
    [onChangeRow],
  );

  const onDeleteRow = useCallback(
    (i: number) => {
      let newKvs = [...displayKvs];
      newKvs.splice(i, 1);
      newKvs = newKvs.filter((el) => !isRowEmpty(el));
      setKvs(newKvs);
    },
    [displayKvs, setKvs],
  );

  return (
    <div className={styles.container}>
      {displayKvs.map(({ key, value }, i) => (
        <KVEditorRow
          key={`${name}-${i}`}
          name={`${name}-${i}`}
          i={i}
          kKey={key}
          value={value}
          setKey={setKey}
          setValue={setValue}
          onDeleteRow={onDeleteRow}
          isDeleteDisabled={readOnly}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

export default KVEditor;
