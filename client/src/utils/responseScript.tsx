import jp from 'jsonpath';

import Response from '../model/Response';
import { errorToast, kvRowsToMap } from '.';
import sandboxedFunction from './sandboxedFunction';

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
  console.log({ response, script });
  try {
    sandboxedFunction(args, script);
  } catch (err) {
    console.log(err);
    errorToast(`${err}`, toast, 5000, 'Error in response script');
  }
}

export { executeResponseScript };
