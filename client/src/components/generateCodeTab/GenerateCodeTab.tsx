import { CopyIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Select,
  useClipboard,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { LanguageName, loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useCodeMirror } from '@uiw/react-codemirror';
import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { CurrentRestRequest } from '../../model/Request';
import { successToast } from '../../utils';
import { generateHTTPSnippet, Target } from '../../utils/httpsnippet';
import styles from './GenerateCodeTab.module.css';

type StateTarget = {
  displayName: string;
  target: Target;
  client: string;
  language: LanguageName;
};

const options: Array<StateTarget> = [
  { displayName: 'Go: Native', target: 'go', client: 'native', language: 'go' },
  {
    displayName: 'Java: Unirest',
    target: 'java',
    client: 'unirest',
    language: 'java',
  },
  {
    displayName: 'Java: OkHttp',
    target: 'java',
    client: 'okhttp',
    language: 'java',
  },
  {
    displayName: 'JavaScript: Fetch',
    target: 'javascript',
    client: 'fetch',
    language: 'javascript',
  },
  {
    displayName: 'JavaScript: Axios',
    target: 'javascript',
    client: 'axios',
    language: 'javascript',
  },
  {
    displayName: 'JavaScript: jQuery.ajax',
    target: 'javascript',
    client: 'jquery',
    language: 'javascript',
  },
  {
    displayName: 'PHP: Curl',
    target: 'php',
    client: 'curl',
    language: 'php',
  },
  {
    displayName: 'Node.js: Native',
    target: 'node',
    client: 'native',
    language: 'javascript',
  },
  {
    displayName: 'Node.js: Request',
    target: 'node',
    client: 'request',
    language: 'javascript',
  },
  {
    displayName: 'Node.js: Unirest',
    target: 'node',
    client: 'unirest',
    language: 'javascript',
  },
  {
    displayName: 'Objective-C: NSURLSession',
    target: 'objc',
    client: 'nsurlsession',
    language: 'objectiveC',
  },
  {
    displayName: 'OCaml: CoHTTP',
    target: 'ocaml',
    client: 'cohttp',
    language: 'javascript',
  },
  {
    displayName: 'Python: Python 3',
    target: 'python',
    client: 'python3',
    language: 'python',
  },
  {
    displayName: 'Python: Requests',
    target: 'python',
    client: 'requests',
    language: 'python',
  },
  {
    displayName: 'Ruby: Native',
    target: 'ruby',
    client: 'native',
    language: 'ruby',
  },
  { displayName: 'Shell: cURL', target: 'shell', client: 'curl', language: 'shell' },
  {
    displayName: 'Shell: HTTPie',
    target: 'shell',
    client: 'httpie',
    language: 'shell',
  },
  { displayName: 'Shell: Wget', target: 'shell', client: 'wget', language: 'shell' },
  {
    displayName: 'Swift: NSURLSession',
    target: 'swift',
    client: 'nsurlsession',
    language: 'swift',
  },
  {
    displayName: 'C#: RestSharp',
    target: 'csharp',
    client: 'restsharp',
    language: 'csharp',
  },
  { displayName: 'C: LibCurl', target: 'c', client: 'libcurl', language: 'c' },
];

type Props = {
  request: CurrentRestRequest;
  selectedEnvData: Record<string, string>;
};

const GenerateCodeTab: FC<Props> = ({ request, selectedEnvData }) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [target, setTarget] = useState<StateTarget>({
    displayName: 'Shell: cURL',
    target: 'shell',
    client: 'curl',
    language: 'shell',
  });
  const extensions = useMemo(() => {
    return [loadLanguage(target.language) ?? []];
  }, [target.language]);
  const [snippet, setSnippet] = useState('');
  const { onCopy } = useClipboard(snippet);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const code = generateHTTPSnippet(
        request,
        target.target,
        target.client,
        selectedEnvData,
      );
      setSnippet(code);
    } catch (e: any) {
      toast({
        title: 'Failed to generate code snippet',
        description: e.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [selectedEnvData, request, target, toast]);

  const { setContainer } = useCodeMirror({
    container: ref.current,
    theme: colorMode,
    value: snippet,
    style: { height: '100%' },
    extensions,
    editable: false,
  });

  useEffect(() => {
    if (ref.current) {
      setContainer(ref.current);
    }
  }, [ref, setContainer]);

  function handleClickTarget(displayName: string) {
    const target = options.find((opt) => opt.displayName === displayName);
    if (!target) return;
    setTarget(target);
  }

  function handleCopyToClipboardClick() {
    onCopy();
    successToast('Copied to clipboard', toast);
  }

  return (
    <>
      <div className={styles.menu}>
        <Select
          w="300px"
          borderRadius={20}
          colorScheme="green"
          backgroundColor={colorMode === 'light' ? 'white' : undefined}
          onChange={(e) => handleClickTarget(e.target.value)}
          value={target.displayName}
        >
          {options.map((opt: any) => (
            <option key={opt.displayName}>{opt.displayName}</option>
          ))}
        </Select>
        <IconButton
          aria-label="copy-snippet"
          isRound
          variant="ghost"
          onClick={handleCopyToClipboardClick}
          icon={<CopyIcon />}
        />
      </div>
      <div className={styles.container} ref={ref} />
    </>
  );
};

export default GenerateCodeTab;
