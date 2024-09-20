import { VscCircleOutline, VscError, VscPass } from 'react-icons/vsc';

import { JasmineSpec, JasmineSuite } from '../../../model/Script';
import styles from './TestsTab.module.css';

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'passed':
      return <VscPass style={{ color: 'var(--chakra-colors-green-500)' }} />;
    case 'failed':
      return <VscError style={{ color: 'var(--chakra-colors-red-500)' }} />;
    default:
      return null;
  }
};

const Suite = ({ suite, depth = 0 }: { suite: JasmineSuite; depth?: number }) => {
  return (
    <div className={styles.suiteItem} style={{ paddingLeft: `${depth * 16}px` }}>
      <div className={styles.suiteHeader}>
        <StatusIcon status={suite.status ?? ''} />
        <span className={styles.suiteDescription}>{suite.description}</span>
        <span className={styles.suiteDuration}>{suite.duration}ms</span>
      </div>
      {suite.specs?.map((spec) => (
        <Spec key={spec.id} spec={spec} depth={depth + 1} />
      ))}
      {suite.children?.map((child) => (
        <Suite key={child.id} suite={child} depth={depth + 1} />
      ))}
    </div>
  );
};

const Spec = ({ spec, depth = 0 }: { spec: JasmineSpec; depth: number }) => {
  return (
    <div style={{ paddingLeft: `${depth}rem` }}>
      <div className={styles.specItem}>
        <StatusIcon status={spec.status ?? ''} />
        <span className={styles.specDescription}>{spec.description}</span>
        <span className={styles.specDuration}>{spec.duration}ms</span>
      </div>
      {spec.failedExpectations && spec.failedExpectations.length > 0 && (
        <div style={{ marginLeft: '1rem' }}>
          <ul>
            {spec.failedExpectations.map((expectation, index) => (
              <li key={index} className={styles.specFailedExpectation}>
                <VscCircleOutline style={{ color: 'var(--chakra-colors-red-500)' }} />
                {expectation.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

type JasmineReportProps = {
  suites: JasmineSuite[];
  error?: string;
};

const TestsTab = ({ suites, error }: JasmineReportProps) => {
  return error ? (
    <div className={styles.error}>Error: {error}</div>
  ) : (
    <div className={styles.jasmineReport}>
      {suites.length > 0 ? (
        suites.map((suite) => <Suite key={suite.id} suite={suite} />)
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          No Tests...
        </div>
      )}
    </div>
  );
};

export default TestsTab;
