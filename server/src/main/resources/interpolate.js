const reservedWords = new Set([
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'let',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
]);

function isValidVariableName(value) {
  if (reservedWords.has(value)) {
    return false;
  }

  if (!/^[a-zA-Z_$]/.test(value)) {
    return false;
  }

  if (!/^[a-zA-Z0-9_$]*$/.test(value)) {
    return false;
  }

  return true;
}

function interpolate0(
  template,
  params,
  debug,
  errors,
  count = 0,
) {
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
    console.log('template', JSON.stringify(template));
    console.log('params', JSON.stringify(params));
  }

  let result;
  try {
    const sanitizedParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (isValidVariableName(key)) {
        sanitizedParams[key] = value;
      } else {
        console.error(`Invalid variable name: ${key}`);
      }
    }
    const paramNames = Object.getOwnPropertyNames(sanitizedParams);
    const vals = Object.values(sanitizedParams);
    const f = new Function(...paramNames, '"use strict";' + 'return `' + template + '`');
    result = f.bind({})(...vals);
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
  if (result.indexOf('${') > -1 && template !== result)
    return interpolate0(result, params, debug, errors, ++count);
  else {
    if (debug) {
      console.log('result', JSON.stringify(result));
      console.log('---- interpolate0 ----');
    }
    return result;
  }
};

function interpolate1(
  obj,
  params,
  debug,
  errors,
) {
  let result = null;
  if (debug) {
    console.log('++++ interpolate1 ++++');
    console.log('obj', JSON.stringify(obj));
  }
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    result = [];
    for (let i = 0; i < obj.length; i++) {
      result.push(interpolate1(obj[i], params, debug, errors));
    }
  } else if (typeof obj === 'object') {
    result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolate1(value, params, debug, errors);
    }
  } else if (typeof obj === 'string') {
    result = interpolate0(obj, params, debug, errors);
  } else {
    result = obj;
  }
  if (debug) {
    console.log('result', JSON.stringify(result));
    console.log('---- interpolate1 ----');
  }
  return result;
};

function interpolate(
  requestString,
  envString,
  debug = false,
) {
  const request = JSON.parse(requestString);
  const env = JSON.parse(envString);
  if (!request || !env)
    return JSON.stringify({
      result: request,
      errors: [{ key: 'env', value: 'request or env not defined' }],
    });
  if (debug) {
    console.log('++++ interpolate ++++');
    console.log('request', JSON.stringify(request));
    console.log('env', JSON.stringify(env));
  }
  const oenv = { ...env };
  oenv.$r = rand;
  oenv.$t = DateTime;
  oenv.$env = env;
  oenv.$btoa = btoa;
  oenv.$atob = atob;
  let errors = [];
  let result = interpolate1(request, oenv, debug, errors);
  if (debug) {
    console.log('result', JSON.stringify(result));
    console.log('errors', JSON.stringify(errors));
    console.log('---- interpolate ----');
  }
  return JSON.stringify({ result, errors });
};
