import { useState } from 'react';

import KVRow from '../../model/KVRow';
import { KVFileRow } from '../../model/KVRow';
import KVEditor from '../kvEditor';
import KVFileEditor from '../kvEditor/KVFileEditor';
import { Button } from '@chakra-ui/react';

type BodyKVEditorProps = {
  content: KVRow[] | KVFileRow[];
  setContent: any;
  selectedEnv: any;
  contentType: string;
};

function BodyKVEditor({
  content,
  setContent,
  selectedEnv,
  contentType,
}: BodyKVEditorProps) {
  //probably should be memo created from content prop instead

  return (
    <>
      {contentType == 'multipart/form-data' && (
        <KVFileEditor
          name="Body"
          kvs={content as KVFileRow[]}
          setKvs={(kvs: KVFileRow[]) => setContent(kvs)}
          canDisableRows={true}
          hasEnvSupport={'BOTH'}
          env={selectedEnv}
        />
      )}
      {contentType === 'application/x-www-form-urlencoded' && (
        <KVEditor
          name="Body"
          kvs={content}
          setKvs={(kvs: KVRow[]) => setContent(kvs)}
          canDisableRows={true}
          hasEnvSupport={'BOTH'}
          env={selectedEnv}
        />
      )}
    </>
  );
}

export default BodyKVEditor;
