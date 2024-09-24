import { JasmineReport } from '../../model/Script';

export default function getJasmineReport(jasmine: any): JasmineReport | null {
  try {
    const rawSuites = jasmine.getGlobal().jsApiReporter.suites();
    const rawSpecs = jasmine.getGlobal().jsApiReporter.specs();
    console.log(jasmine.getGlobal().jsApiReporter.status());
    const suitesObject: any = JSON.parse(rawSuites);
    const suites: any[] = Object.values(suitesObject);
    const specs = JSON.parse(rawSpecs);

    const result: any[] = [];

    // Loop through each spec and add to the corresponding suite
    for (const rawSpec of specs) {
      const spec = rawSpec as any;
      const suiteId = spec.parentSuiteId;
      if (!suiteId) continue;

      const suite = suites.find((suite: any) => suite.id === suiteId);
      if (!suite) continue;

      const newSpecs = suite.specs || [];
      newSpecs.push(spec);
      suite.specs = newSpecs;
    }

    let overallStatus = 'passed';

    // Loop through suites to determine the status and organize specs
    for (const suite of suites) {
      const sortedSpecs = (suite.specs || []).sort((a: any, b: any) =>
        a.id.localeCompare(b.id),
      );
      suite.specs = sortedSpecs;

      let status = 'passed';
      for (const rawSpec of suite.specs) {
        const spec = rawSpec as any;
        const specStatus = spec.status || 'passed';
        if (specStatus === 'failed') {
          status = 'failed';
          overallStatus = 'failed';
          break;
        }
      }
      suite.status = status;

      const parentId = suite.parentSuiteId;
      if (!parentId) {
        result.push(suite);
        continue;
      }

      const parent = suites.find((parentSuite: any) => parentSuite.id === parentId);
      if (!parent) continue;

      const children = parent.children || [];
      children.push(suite);
      parent.children = children;
    }

    const sortedResult = result.sort((a, b) => a.id.localeCompare(b.id));

    console.log('Jasmine Report:', sortedResult);

    return { suites: sortedResult, status: overallStatus };
  } catch (e) {
    console.error(e);
  }

  return null;
}
