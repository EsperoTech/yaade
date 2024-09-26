interface Script {
  id: number;
  collectionId: number;
  ownerId: number;
  data: ScriptData;
}

interface ScriptData {
  name?: string;
  description?: string;
  cronExpression?: string;
  script?: string;
  selectedEnvName?: string;
  enabled?: boolean;
  lastRun?: number;
  results?: ScriptResult[];
}

interface ScriptResult {
  success?: boolean;
  executionTime?: number;
  jasmineReport?: JasmineReport;
  logs?: ScriptLog[];
  error?: string;
}

interface ScriptLog {
  time: number;
  message: string;
}

interface JasmineReport {
  suites?: JasmineSuite[];
  status: string;
}

interface JasmineSuite {
  id?: string;
  fullName?: string;
  description?: string;
  duration?: number;
  status?: string;
  specs?: JasmineSpec[];
  children?: JasmineSuite[];
}

interface JasmineFailedExpctation {
  matcherName?: string;
  message?: string;
  stack?: string;
  passed?: boolean;
}

interface JasmineSpec {
  id?: string;
  parentSuiteId?: string;
  fullName?: string;
  description?: string;
  duration?: number;
  status?: string;
  failedExpectations?: JasmineFailedExpctation[];
}

interface CurrentScript {
  id: number;
  collectionId: number;
  ownerId: number;
  data: ScriptData;
  isChanged: boolean;
}

interface SidebarScript {
  id: number;
  collectionId: number;
  name: string;
}

export type {
  CurrentScript,
  JasmineReport,
  JasmineSpec,
  JasmineSuite,
  ScriptLog,
  ScriptResult,
  SidebarScript,
};

export default Script;
