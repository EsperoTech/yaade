import { HTTPSnippet } from 'httpsnippet';

import { CurrentRestRequest } from '../model/Request';
import interpolate from './interpolate';

export type Target =
  | 'c'
  | 'clojure'
  | 'csharp'
  | 'go'
  | 'http'
  | 'java'
  | 'javascript'
  | 'kotlin'
  | 'node'
  | 'objc'
  | 'ocaml'
  | 'php'
  | 'powershell'
  | 'python'
  | 'r'
  | 'ruby'
  | 'shell'
  | 'swift';

function generateHTTPSnippet(
  request: CurrentRestRequest,
  target: Target,
  client?: string,
  selectedEnvData: Record<string, any> = {},
): string {
  const interpolatedResult = interpolate(request, selectedEnvData);
  const interpolated = (interpolatedResult.result as CurrentRestRequest) ?? request;
  const postData: any = {};
  if (interpolated.data.contentType === 'application/x-www-form-urlencoded') {
    const params = interpolated.data.formDataBody
      ?.filter((el: any) => el.isEnabled !== false)
      .map((kv: any) => {
        return {
          name: kv.key,
          value: kv.value,
        };
      });
    postData.params = params;
    postData.mimeType = 'application/x-www-form-urlencoded';
  } else if (interpolated.data.contentType) {
    postData.mimeType = interpolated.data.contentType;
    postData.text = interpolated.data.body;
  } else {
    postData.mimeType = 'text/plain';
    postData.text = interpolated.data.body;
  }
  const headers = interpolated.data.headers
    ?.filter((el: any) => el.isEnabled !== false)
    .map((header: any) => {
      return {
        name: header.key,
        value: header.value,
      };
    });
  const uri = interpolated.data.uri ?? 'https://example.com';
  const url = uri.startsWith('http') ? uri : `http://${uri}`;
  const opts: any = {
    method: interpolated.data.method ?? 'GET',
    url,
    headers: headers ?? [],
  };
  if (opts.method !== 'GET') {
    opts.postData = postData;
  }
  const snippet = new HTTPSnippet(opts);
  const res = snippet.convert(target, client);
  if (typeof res !== 'string') {
    throw new Error('Failed to generate snippet');
  }
  return res;
}

export { generateHTTPSnippet };
