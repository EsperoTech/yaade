import { useCallback, useEffect, useMemo, useRef } from 'react';

import KVRow from '../../model/KVRow';
import styles from './KVEditor.module.css';
import KVEditorRow from './KVEditorRow';

type KVEditorProps = {
  kvs: Array<KVRow>;
  setKvs?: any;
  name: string;
  readOnly?: boolean;
  canDisableRows?: boolean;
  hasEnvSupport: 'BOTH' | 'NONE' | 'VALUE_ONLY';
  env?: any;
};

const EMPTY_ROW = { key: '', value: '' };
const isRowEmpty = (row: KVRow) => row.key === '' && row.value === '';

function KVEditor({
  name,
  kvs,
  setKvs,
  readOnly,
  canDisableRows = false,
  hasEnvSupport,
  env,
}: KVEditorProps) {
  // we copy the data so we can append an empty last row without
  // mutating the original data
  const displayKvs = useMemo(() => {
    const result = kvs ? [...kvs] : [];
    if (!readOnly && (result.length === 0 || !isRowEmpty(result[result.length - 1]))) {
      result.push({ ...EMPTY_ROW });
    }
    return result;
  }, [kvs, readOnly]);

  const onChangeRowRef = useRef<
    (i: number, param: string, value: string | boolean) => void
  >((i: number, param: string, value: string | boolean) => {});
  const onDeleteRowRef = useRef<(i: number) => void>((i: number) => {});

  useEffect(() => {
    onChangeRowRef.current = (i: number, param: string, value: string | boolean) => {
      let newKvs = [...displayKvs];
      const newRow = { ...newKvs[i] } as any;
      newRow[param] = value;
      newKvs[i] = newRow;
      newKvs = newKvs.filter((el) => !isRowEmpty(el));

      setKvs(newKvs);
    };
  }, [displayKvs, setKvs]);

  useEffect(() => {
    onDeleteRowRef.current = (i: number) => {
      let newKvs = [...displayKvs];
      newKvs.splice(i, 1);
      newKvs = newKvs.filter((el) => !isRowEmpty(el));
      setKvs(newKvs);
    };
  }, [displayKvs, setKvs]);

  return (
    <div className={styles.container}>
      {displayKvs.map(({ key, value, isEnabled }, i) => (
        <KVEditorRow
          key={`${name}-${i}`}
          name={`${name}-${i}`}
          i={i}
          kKey={key}
          value={value}
          isEnabled={isEnabled}
          onChangeRow={onChangeRowRef}
          canDisableRow={canDisableRows}
          onDeleteRow={onDeleteRowRef}
          isEnableDisabled={canDisableRows && !key && !value}
          isDeleteDisabled={!key && !value ? true : readOnly}
          readOnly={readOnly}
          hasEnvSupport={hasEnvSupport}
          env={env}
        />
      ))}
    </div>
  );
}

export default KVEditor;
