import KVRow from '../../model/KVRow';
import KVEditor from '../kvEditor';

type BodyKVEditorProps = {
  content: KVRow[];
  setContent: any;
  selectedEnvData: Record<string, string>;
  contentType: string;
  isMultipart?: boolean;
};

function BodyKVEditor({
  content,
  setContent,
  selectedEnvData,
  contentType,
  isMultipart,
}: BodyKVEditorProps) {
  return (
    <>
      <KVEditor
        name="Body"
        kvs={content}
        setKvs={(kvs: KVRow[]) => setContent(kvs)}
        canDisableRows={true}
        hasEnvSupport={'BOTH'}
        selectedEnvData={selectedEnvData}
        isMultiPart={isMultipart}
      />
    </>
  );
}

export default BodyKVEditor;
