interface FileDescription {
  id: number;
  name: string;
  data: FileDescriptionData;
}

interface FileDescriptionData {
  groups?: string[];
}

export default FileDescription;
