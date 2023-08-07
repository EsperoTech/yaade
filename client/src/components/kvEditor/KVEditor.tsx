import { useColorMode } from '@chakra-ui/react';

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
  const displayKvs = kvs ? [...kvs] : [];

  if (
    !readOnly &&
    (displayKvs.length === 0 || !isRowEmpty(displayKvs[displayKvs.length - 1]))
  ) {
    displayKvs.push({ ...EMPTY_ROW });
  }

  const onChangeRow = (i: number, param: string, value: string) => {
    console.log({ i, param, value });
    let newKvs = [...displayKvs];
    const newRow = { ...newKvs[i] } as any;
    newRow[param] = value;
    newKvs[i] = newRow;
    newKvs = newKvs.filter((el) => !isRowEmpty(el));

    setKvs(newKvs);
  };

  const setKey = (i: number, key: string) => onChangeRow(i, 'key', key);
  const setValue = (i: number, value: string) => onChangeRow(i, 'value', value);

  const onDeleteRow = (i: number) => {
    let newKvs = [...displayKvs];
    newKvs.splice(i, 1);
    newKvs = newKvs.filter((el) => !isRowEmpty(el));
    setKvs(newKvs);
  };

  return (
    <div className={styles.container}>
      {displayKvs.map(({ key, value }, i) => (
        <KVEditorRow
          i={i}
          name={name}
          key={key}
          value={value}
          deleteDisabled={i === displayKvs.length - 1}
          setKey={setKey}
          setValue={setValue}
          readOnly={readOnly}
          onDeleteRow={onDeleteRow}
        />
      ))}
    </div>
  );
}

export default KVEditor;
