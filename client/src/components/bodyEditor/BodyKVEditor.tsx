import KVRow from '../../model/KVRow';
import KVEditor from '../kvEditor';

type BodyKVEditorProps = {
  content: KVRow[];
  setContent: any;
  selectedEnv: any;
  contentType: string;
};

function BodyKVEditor({ content, setContent, selectedEnv }: BodyKVEditorProps) {
  return (
    <>
      <KVEditor
        name="Body"
        kvs={content}
        setKvs={(kvs: KVRow[]) => setContent(kvs)}
        canDisableRows={true}
        hasEnvSupport={'BOTH'}
        env={selectedEnv}
      />
    </>
  );
}

export default BodyKVEditor;
