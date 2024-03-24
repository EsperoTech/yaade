interface KVRow {
  key: string;
  value: string;
  isEnabled?: boolean;
}

interface KVFileRow extends KVRow {
  fileSource: string;
}

export type { KVFileRow };
export default KVRow;
