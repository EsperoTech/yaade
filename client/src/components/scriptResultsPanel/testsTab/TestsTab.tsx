import { useColorMode } from '@chakra-ui/react';
import { VscCircleOutline, VscError, VscPass } from 'react-icons/vsc';

import { JasmineSpec, JasmineSuite } from '../../../model/Script';
import { cn } from '../../../utils';
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

const Suite = ({
  suite,
  colorMode,
  depth = 0,
}: {
  suite: JasmineSuite;
  colorMode: string;
  depth?: number;
}) => {
  return (
    <div className={styles.suiteItem} style={{ paddingLeft: `${depth * 16}px` }}>
      <div className={cn(styles, 'suiteHeader', [colorMode])}>
        <StatusIcon status={suite.status ?? ''} />
        <span className={styles.suiteDescription}>{suite.description}</span>
        <span className={styles.suiteDuration}>{suite.duration}ms</span>
      </div>
      {suite.specs?.map((spec) => (
        <Spec key={spec.id} spec={spec} colorMode={colorMode} depth={depth + 1} />
      ))}
      {suite.children?.map((child) => (
        <Suite key={child.id} suite={child} depth={depth + 1} colorMode={colorMode} />
      ))}
    </div>
  );
};

const Spec = ({
  spec,
  colorMode,
  depth = 0,
}: {
  spec: JasmineSpec;
  colorMode: string;
  depth: number;
}) => {
  return (
    <div style={{ paddingLeft: `${depth}rem` }}>
      <div className={cn(styles, 'specItem', [colorMode])}>
        <StatusIcon status={spec.status ?? ''} />
        <span className={styles.specDescription}>{spec.description}</span>
        <span className={styles.specDuration}>{spec.duration}ms</span>
      </div>
      {spec.failedExpectations && spec.failedExpectations.length > 0 && (
        <div style={{ marginLeft: '1rem' }}>
          <ul>
            {spec.failedExpectations.map((expectation, index) => (
              <li
                key={index}
                className={cn(styles, 'specFailedExpectation', [colorMode])}
              >
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
  const { colorMode } = useColorMode();
  return error ? (
    <div className={styles.error}>Error: {error}</div>
  ) : (
    <div className={styles.jasmineReport}>
      {suites.length > 0 ? (
        suites.map((suite) => (
          <Suite key={suite.id} suite={suite} colorMode={colorMode} />
        ))
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          No Tests...
        </div>
      )}
    </div>
  );
};

export default TestsTab;
