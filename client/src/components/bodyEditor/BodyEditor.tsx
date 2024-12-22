import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { Button, IconButton, Select, useToast } from '@chakra-ui/react';
import { useMemo } from 'react';

import KVRow from '../../model/KVRow';
import { beautifyBody, errorToast } from '../../utils';
import styles from './BodyEditor.module.css';
import BodyKVEditor from './BodyKVEditor';
import BodyTextEditor from './BodyTextEditor';

type BodyEditorProps = {
  content?: string;
  formDataContent?: KVRow[];
  setContent: any;
  setFormDataContent: any;
  selectedEnvData: Record<string, string>;
  contentType: string;
  setContentType: any;
  setContentTypeHeader: any;
};

function BodyEditor({
  content,
  formDataContent,
  setContent,
  setFormDataContent,
  selectedEnvData,
  contentType,
  setContentType,
  setContentTypeHeader,
}: BodyEditorProps) {
  const toast = useToast();
  function handleBeautifyClick() {
    try {
      if (!content) return;
      const beautifiedBody = beautifyBody(content, contentType);
      setContent(beautifiedBody);
    } catch (e) {
      errorToast('Could not format body.', toast);
    }
  }

  let editor = null;
  switch (contentType) {
    case 'application/x-www-form-urlencoded':
      editor = (
        <BodyKVEditor
          content={formDataContent ?? []}
          setContent={setFormDataContent}
          selectedEnvData={selectedEnvData}
          contentType={contentType}
          isMultipart={false}
        />
      );
      break;
    case 'multipart/form-data':
      editor = (
        <BodyKVEditor
          content={formDataContent ?? []}
          setContent={setFormDataContent}
          selectedEnvData={selectedEnvData}
          contentType={contentType}
          isMultipart={true}
        />
      );
      break;
    default:
      editor = (
        <BodyTextEditor
          content={content ?? ''}
          setContent={setContent}
          selectedEnvData={selectedEnvData}
          contentType={contentType}
        />
      );
  }

  const isKVEditor = useMemo(() => {
    return ['application/x-www-form-urlencoded', 'multipart/form-data'].includes(
      contentType,
    );
  }, [contentType]);

  return (
    <>
      <div className={styles.menu}>
        <Select
          size="xs"
          width="150px"
          onChange={(e) => setContentType(e.target.value)}
          value={contentType}
          outline="none"
        >
          <option value="application/json">application/json</option>
          <option value="application/xml">application/xml</option>
          <option value="text/html">text/html</option>
          <option value="text/plain">text/plain</option>
          <option value="application/x-www-form-urlencoded">
            application/x-www-form-urlencoded
          </option>
          <option value="multipart/form-data">multipart/form-data</option>
          <option value="none">none</option>
        </Select>
        <Button
          ml="2"
          size="xs"
          onClick={() => setContentTypeHeader(contentType)}
          variant="outline"
          disabled={contentType === 'none'}
        >
          Set Header
        </Button>
        {!isKVEditor && (
          <div className={styles.iconBar}>
            <IconButton
              aria-label="beautify-content"
              isRound
              variant="ghost"
              size="xs"
              disabled={content?.length === 0}
              onClick={handleBeautifyClick}
              icon={<StarIcon />}
            />
            <IconButton
              aria-label="delete-content"
              isRound
              variant="ghost"
              size="xs"
              disabled={content?.length === 0}
              onClick={() => setContent('')}
              icon={<DeleteIcon />}
            />
          </div>
        )}
      </div>
      {editor}
    </>
  );
}

export default BodyEditor;
