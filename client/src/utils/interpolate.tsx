import { DateTime } from 'luxon';
import { MersenneTwister19937, Random } from 'random-js';

import { isValidVariableName } from '.';
import { sandboxedFunction } from './sandboxedFunction';

type InterpolateError = {
  key: string;
  value: string;
};

type InterpolateResult = {
  result: any;
  errors: any[];
};

const r = new Random(MersenneTwister19937.autoSeed());

const interpolate0 = function (
  template: string,
  params: Record<string, string>,
  debug: boolean,
  errors: InterpolateError[],
  count = 0,
): string {
  if (count > 20) {
    errors.push({
      key: template,
      value: 'too many iterations',
    });
    return template;
  }

  if (debug) {
    console.log('++++ interpolate0 ++++');
    console.log('count', count);
    console.log('template', template);
    console.log('parmas', params);
  }

  let result;
  try {
    const sanitizedParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (isValidVariableName(key)) {
        sanitizedParams[key] = value;
      } else {
        console.error(`Invalid variable name: ${key}`);
      }
    }
    result = sandboxedFunction(sanitizedParams, 'return `' + template + '`');
  } catch (err) {
    errors.push({
      key: template,
      value: '' + err,
    });
    if (debug) {
      console.log('error', errors);
      console.log('---- interpolate0 ----');
    }
    return template;
  }
  if (result.indexOf('${') > -1 && template != result)
    return interpolate0(result, params, debug, errors, ++count);
  else {
    if (debug) {
      console.log('result', result);
      console.log('---- interpolate0 ----');
    }
    return result;
  }
};

const interpolate1 = function (
  obj: any,
  params: Record<string, any>,
  debug: boolean,
  errors: any[],
): any {
  let result: any = null;
  if (debug) {
    console.log('++++ interpolate1 ++++');
    console.log('obj', obj);
  }
  if (!obj) return obj;
  if (obj.constructor === Array) {
    result = [];
    for (let i = 0; i < obj.length; i++) {
      result.push(interpolate1(obj[i], params, debug, errors));
    }
  } else if (typeof obj == 'object') {
    result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolate1(value, params, debug, errors);
    }
  } else if (typeof obj == 'string') {
    result = interpolate0(obj, params, debug, errors);
  } else {
    result = obj;
  }
  if (debug) {
    console.log('result', result);
    console.log('---- interpolate1 ----');
  }
  return result;
};

const interpolate = function (
  request: any,
  env: Record<string, any>,
  debug = false,
): InterpolateResult {
  if (!request || !env)
    return {
      result: request,
      errors: [{ key: 'env', value: 'request or env not defined' }],
    };
  if (debug) {
    console.log('++++ interpolate ++++');
    console.log('request', request);
    console.log('env', env);
  }
  const oenv: Record<string, any> = { ...env };
  oenv.$r = r;
  oenv.$t = DateTime;
  oenv.$env = oenv;
  oenv.$btoa = btoa;
  oenv.$atob = atob;
  let errors: any[] = [];
  let result = interpolate1(request, oenv, debug, errors) as Request;
  if (debug) {
    console.log('result', result);
    console.log('errors', errors);
    console.log('---- interpolate ----');
  }
  return { result, errors };
};

export default interpolate;
