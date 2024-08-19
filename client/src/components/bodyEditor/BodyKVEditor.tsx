import KVRow from '../../model/KVRow';
import KVEditor from '../kvEditor';

type BodyKVEditorProps = {
  content: KVRow[];
  setContent: any;
  selectedEnv: any;
  contentType: string;
  isMultipart?: boolean;
};

function BodyKVEditor({
  content,
  setContent,
  selectedEnv,
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
        env={selectedEnv}
        isMultiPart={isMultipart}
      />
    </>
  );
}

export default BodyKVEditor;
