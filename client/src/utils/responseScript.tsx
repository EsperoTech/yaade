import jp from 'jsonpath';

import Response from '../model/Response';
import sandboxedFunction from './sandboxedFunction';

const jpath = function (expr: string, text: string) {
  const json = JSON.parse(text);
  return jp.query(json, expr);
};

const suiteTitle = function (suite: Suite): string {
  if (!suite) return '';
  if (suite.parent == suite || !suite.parent) return suite.title;
  return suiteTitle(suite.parent) + ' ' + suite.title;
};

const ident = ' ';
const cr = '\n';
const err = 'x ';
const ok = '# ';

function asString(prevSuite: Suite, res: TestResult): string {
  var result = '';
  var s = res.suiteTitle;
  if (s)
    for (var i = 0; i < s.length; i++) {
      if (prevSuite && prevSuite.length > i && prevSuite[i] == s[i]) result += ident;
      else {
        result += s[i];
        result += cr;
        for (var j = 0; j < i; j++) result += ident;
      }
    }
  if (r.err) {
    result += err;
    result += title;
    result += ': ';
    result += r.err;
  } else {
    result += ok;
    result += title;
  }
  result += cr;
  return result;
}

function stats(testResults: TestResult[]): string {
  if (!testResults) return '';
  let numPassed = 0;
  let numErrors = 0;
  testResults.forEach((res) => {
    if (res.err) {
      numErrors++;
    } else {
      numPassed++;
    }
  });
  return (
    '#passed: ' +
    numPassed +
    ' #errors: ' +
    numErrors +
    ' #total: ' +
    testResults.length +
    cr
  );
}

function asString(testResult: TestResult) {
  var result = '';
  if (!testResult) return result;
  testResult.sort(compareResult);
  var prevSuite = null;
  for (var i = 0; i < testResult.length; i++) {
    result += asString(prevSuite, testResult[i]);
    prevSuite = testResult[i].suite;
  }
  return stats(testResult) + result;
}

interface Suite {
  title: string;
  tests: Test[];
  parent?: Suite;
}

interface Test {
  title: string;
  fn: any;
  parent: Suite;
}

interface TestResult {
  err?: any;
  title: string;
  suiteTitle: string;
}

interface ResponseScriptResult {
  err?: any;
  result: string;
}

function executeResponseScript(
  response: Response,
  script: string,
  set: any,
): ResponseScriptResult {
  const suites: Suite[] = [
    {
      title: 'Hello',
      tests: [],
    },
  ];
  const describe = (title: string, fn: any) => {
    var newSuite: Suite = {
      title,
      tests: [],
    };
    suites.push(newSuite);
    fn();
    suites.pop();
    newSuite.parent = suites[suites.length - 1];
    suites.push(newSuite);
  };

  const it = (title: string, fn: any) => {
    const test = {
      title,
      fn,
      parent: suites[suites.length - 1],
    };
    suites[suites.length - 1].tests.push(test);
  };

  const run = () => {
    const testResults: TestResult[] = [];
    suites.forEach((suite) => {
      suite.tests.forEach((test) => {
        try {
          test.fn();
          testResults.push({
            title: test.title,
            suiteTitle: suiteTitle(test.parent),
          });
        } catch (err) {
          testResults.push({
            err: err,
            title: test.title,
            suiteTitle: suiteTitle(test.parent),
          });
        }
      });
    });
    return testResults;
  };

  const params: Record<string, any> = {};
  params.env = { set };
  params.res = response;
  params.jp = jpath;
  params.describe = describe;
  params.it = it;

  try {
    sandboxedFunction(params, script);
    const results = run();
    return {
      result: asString(results),
      env: toEnv(oenv, env),
    };
  } catch (err) {
    console.log(err);
    return {
      error: err,
    };
  }
}

export { executeResponseScript };
