import { HTTPSnippet } from 'httpsnippet';

import { CurrentRequest } from '../model/Request';
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
  request: CurrentRequest,
  target: Target,
  client?: string,
  env: Record<string, any> = {},
): string {
  const interpolatedResult = interpolate(request, env.data ?? {});
  const interpolated = interpolatedResult.result as CurrentRequest;
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
  const opts: any = {
    method: interpolated.data.method ?? 'GET',
    url: interpolated.data.uri ?? 'https://example.com',
    headers: headers ?? [],
    postData,
  };
  const snippet = new HTTPSnippet(opts);
  const res = snippet.convert(target, client);
  if (typeof res !== 'string') {
    throw new Error('Failed to generate snippet');
  }
  return res;
}

export { generateHTTPSnippet };
