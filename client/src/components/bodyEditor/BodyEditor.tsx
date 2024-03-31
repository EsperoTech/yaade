import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { IconButton, Select, useToast } from '@chakra-ui/react';
import { useMemo } from 'react';

import KVRow from '../../model/KVRow';
import KVFileRow from '../../model/KVRow';
import { beautifyBody, errorToast } from '../../utils';
import styles from './BodyEditor.module.css';
import BodyKVEditor from './BodyKVEditor';
import BodyTextEditor from './BodyTextEditor';

type BodyEditorProps = {
  content: string | KVRow[] | KVFileRow[];
  setContent: any;
  selectedEnv: any;
  contentType: string;
  setContentType: any;
};

function BodyEditor({
  content,
  setContent,
  selectedEnv,
  contentType,
  setContentType,
}: BodyEditorProps) {
  const toast = useToast();
  function handleBeautifyClick() {
    try {
      if (typeof content != 'string') {
        console.debug('Cannot beautify. Content is not a string.');
        return;
      }
      const beautifiedBody = beautifyBody(content, contentType);
      setContent(beautifiedBody);
    } catch (e) {
      errorToast('Could not format body.', toast);
    }
  }

  const isTextEditor = useMemo(() => {
    return ['application/json', 'application/xml', 'text/html', 'text/plain'].includes(
      contentType,
    );
  }, [contentType]);
  const isKVEditor = useMemo(() => {
    return ['multipart/form-data', 'application/x-www-form-urlencoded'].includes(
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
        <div className={styles.iconBar}>
          {isTextEditor && (
            <IconButton
              aria-label="beautify-content"
              isRound
              variant="ghost"
              size="xs"
              disabled={!isTextEditor}
              onClick={handleBeautifyClick}
              icon={<StarIcon />}
            />
          )}
          <IconButton
            aria-label="delete-content"
            isRound
            variant="ghost"
            size="xs"
            disabled={content.length === 0}
            onClick={() => setContent('')}
            icon={<DeleteIcon />}
          />
        </div>
      </div>
      {isTextEditor && typeof content == 'string' && (
        <BodyTextEditor
          content={content ?? ''}
          setContent={setContent}
          selectedEnv={selectedEnv}
          contentType={contentType}
        />
      )}
      {isKVEditor && (
        <BodyKVEditor
          content={typeof content == 'string' ? [] : content}
          setContent={setContent}
          selectedEnv={selectedEnv}
          contentType={contentType}
        />
      )}
    </>
  );
}

export default BodyEditor;
