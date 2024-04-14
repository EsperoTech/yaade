interface KVRow {
  key: string;
  value: string;
  isEnabled?: boolean;
}

export interface KVFileRow {
  key: string;
  value: string | File;
  isFile?: boolean;
  isEnabled?: boolean;
}

export default KVRow;
