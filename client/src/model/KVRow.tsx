interface KVRow {
  key: string;
  value: string;
  isEnabled?: boolean;
  file?: KVRowFile;
  type?: 'kv' | 'file';
}

interface KVRowFile {
  id: number;
  name: string;
}

export default KVRow;

export type { KVRowFile };
