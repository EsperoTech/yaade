const sandboxedFunction = function (args: Record<string, string>, script: string) {
  const params = Object.getOwnPropertyNames(args);
  const vals = Object.values(args);

  // 'function': can become a GeneratorFunction that can access global scope
  const potentiallyMalicious = ['function'];

  potentiallyMalicious.forEach((s) => {
    if (script.includes(s)) {
      throw Error(`Script contains potentially malicious code (${s})`);
    }
  });

  const blacklist = [
    ...Object.getOwnPropertyNames(window).filter(
      (e) => e !== 'eval' && e !== 'arguments',
    ),
  ];

  params.push(...blacklist);
  const f = new Function(...params, '"use strict";' + script);
  return f.bind({})(...vals);
};

export default sandboxedFunction;
