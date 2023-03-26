import jp from 'jsonpath';
import { DateTime } from 'luxon';

import Request from '../model/Request';
import Response from '../model/Response';
import { errorToast, kvRowsToMap } from '.';
import { asyncSandboxedFunction, sandboxedFunction } from './sandboxedFunction';

const jpath = function (expr: string, value: string) {
  let json = value;
  if (typeof value === 'string') json = JSON.parse(value);
  return jp.value(json, expr);
};

function executeResponseScript(
  response: Response,
  script: string,
  set: any,
  get: any,
  toast: any,
) {
  const args: Record<string, any> = {};
  args.env = { set, get };
  args.res = {
    body: response.body,
    headers: kvRowsToMap(response.headers),
    status: response.status,
  };
  args.jp = jpath;
  args.DateTime = DateTime;
  args.log = (...data: any[]) => console.log(`[Response Script]`, ...data);
  try {
    sandboxedFunction(args, script);
  } catch (err) {
    console.log(err);
    errorToast(`${err}`, toast, 5000, 'Error in response script');
  }
}

async function executeRequestScript(
  request: Request,
  script: string,
  set: any,
  get: any,
  exec: any,
  toast: any,
  envName?: string,
) {
  const args: Record<string, any> = {};
  args.env = { set, get, name: envName };
  args.req = {
    uri: request.data.uri,
    body: request.data.body,
    method: request.data.method,
    headers: kvRowsToMap(request.data.headers),
  };
  args.jp = jpath;
  args.DateTime = DateTime;
  args.exec = exec;
  args.log = (...data: any[]) =>
    console.log(`[Request Script: ${request.id} - ${envName ?? 'NO_ENV'}]`, ...data);
  try {
    await asyncSandboxedFunction(args, script);
  } catch (err) {
    console.log(err);
    errorToast(`${err}`, toast, 5000, 'Error in request script');
  }
}

export { executeRequestScript, executeResponseScript };
