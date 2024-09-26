function containsGeneratorFunction(codeString: string): boolean {
  // Regular expression to detect generator function declaration (function* name() {})
  const generatorFunctionPattern = /\bfunction\s*\*/;

  // Regular expression to detect arrow function generators (async function* () => {})
  const arrowGeneratorPattern = /\*\s*=>/;

  // Test the string for both patterns
  return (
    generatorFunctionPattern.test(codeString) || arrowGeneratorPattern.test(codeString)
  );
}

const createSandboxedFunction = function (
  args: Record<string, string>,
  script: string,
  isAsync = false,
) {
  const params = Object.getOwnPropertyNames(args);

  if (containsGeneratorFunction(script)) {
    throw new Error('Generator functions are not supported');
  }

  const blacklist = [
    ...Object.getOwnPropertyNames(window).filter(
      (e) => e !== 'eval' && e !== 'arguments' && e !== 'btoa' && e !== 'atob',
    ),
  ];

  params.push(...blacklist);
  if (isAsync) {
    script = `return (async function() {${script}})()`;
  }
  return new Function(...params, '"use strict";' + script);
};

const sandboxedFunction = function (args: Record<string, string>, script: string) {
  const vals = Object.values(args);
  const f = createSandboxedFunction(args, script);
  return f.bind({})(...vals);
};

const asyncSandboxedFunction = async function (
  args: Record<string, string>,
  script: string,
) {
  const vals = Object.values(args);
  const f = createSandboxedFunction(args, script, true);
  return await f.bind({})(...vals);
};

export { asyncSandboxedFunction, sandboxedFunction };
