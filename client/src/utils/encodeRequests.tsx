import { FormDataEncoder } from 'form-data-encoder';
import { Blob, FormData } from 'formdata-node';

import { KVFileRow } from '../model/KVRow';

const encodeFormDataBody = async (kvs: KVFileRow[]): Promise<string> => {
  if (!kvs) {
    return '';
  }
  let formData = new FormData();
  for (const kv of kvs) {
    if (kv.isFile) {
      formData.append(kv.key, new Blob([kv.value]));
    } else {
      formData.append(kv.key, kv.value);
    }
  }

  const encoder = new FormDataEncoder(formData);
  const blob = new Blob(encoder, { type: encoder.contentType });
  const formDataString = await blob.text();
  return formDataString;
};

export { encodeFormDataBody };
