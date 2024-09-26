import jp from 'jsonpath';
import { DateTime } from 'luxon';
import { MersenneTwister19937, Random } from 'random-js';

import Request from '../model/Request';
import Response from '../model/Response';
import { JasmineReport } from '../model/Script';
import { kvRowsToMap } from '.';
import bootJasmine from './jasmine/jasmine';
import getJasmineReport from './jasmine/parseReport';
import { asyncSandboxedFunction, sandboxedFunction } from './sandboxedFunction';

const rand = new Random(MersenneTwister19937.autoSeed());

const jpath = function (expr: string, value: string) {
  let json = value;
  if (typeof value === 'string') json = JSON.parse(value);
  return jp.value(json, expr);
};

async function executeResponseScript(
  request: Request,
  response: Response,
  script: string,
  set: any,
  get: any,
  exec: any,
  toast: any,
  isCollectionLevel: boolean,
  envName?: string,
): Promise<JasmineReport | null> {
  const jasmine = bootJasmine();
  const jasmineEnv = jasmine.getEnv();
  const args: Record<string, any> = {
    describe: jasmineEnv.describe,
    it: jasmineEnv.it,
    expect: jasmineEnv.expect,
    fail: jasmineEnv.fail,
    beforeEach: jasmineEnv.beforeEach,
    afterEach: jasmineEnv.afterEach,
    beforeAll: jasmineEnv.beforeAll,
    afterAll: jasmineEnv.afterAll,
  };
  args.env = { set, get, name: envName };
  args.res = {
    body: response.body,
    headers: kvRowsToMap(response.headers),
    status: response.status,
  };
  args.jp = jpath;
  args.btoa = btoa;
  args.atob = atob;
  args.DateTime = DateTime;
  args.rand = rand;
  args.exec = exec;
  if (isCollectionLevel) {
    args.log = (...data: any[]) =>
      console.log(
        `[Collection Response Script: ${request.collectionId} - ${envName ?? 'NO_ENV'}]`,
        ...data,
      );
  } else {
    args.log = (...data: any[]) =>
      console.log(`[Response Script: ${request.id} - ${envName ?? 'NO_ENV'}]`, ...data);
  }
  try {
    await asyncSandboxedFunction(args, script);
    // TODO: env.name does not work
    // TODO: async jasmine spec does not work
    await jasmineEnv.execute();
    return getJasmineReport(jasmine);
  } catch (err: any) {
    // NOTE: this is to prevent stacked error messages due to exec loop
    const msg = err.message.startsWith('Error in request script')
      ? err.message
      : `Error in request script [id: ${request.id}]: ${err}`;
    throw Error(msg);
  }
}

async function executeRequestScript(
  request: Request,
  script: string,
  set: any,
  get: any,
  exec: any,
  isCollectionLevel: boolean,
  envName?: string,
) {
  const args: Record<string, any> = {};
  args.env = { set, get, name: envName };
  args.req = {
    uri: request.data.uri,
    body: request.data.body,
    method: request.data.method,
    headers: kvRowsToMap(request.data.headers ?? []),
  };
  args.jp = jpath;
  args.btoa = window.btoa;
  args.atob = window.atob;
  args.DateTime = DateTime;
  args.rand = rand;
  args.exec = exec;
  if (isCollectionLevel) {
    args.log = (...data: any[]) =>
      console.log(
        `[Collection Request Script: ${request.collectionId} - ${envName ?? 'NO_ENV'}]`,
        ...data,
      );
  } else {
    args.log = (...data: any[]) =>
      console.log(`[Request Script: ${request.id} - ${envName ?? 'NO_ENV'}]`, ...data);
  }
  try {
    await asyncSandboxedFunction(args, script);
  } catch (err: any) {
    // NOTE: this is to prevent stacked error messages due to exec loop
    const msg = err.message.startsWith('Error in request script')
      ? err.message
      : `Error in request script [id: ${request.id}]: ${err}`;
    throw Error(msg);
  }
}

export { executeRequestScript, executeResponseScript };
