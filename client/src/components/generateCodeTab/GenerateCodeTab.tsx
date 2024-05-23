import { CopyIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Select,
  useClipboard,
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { loadLanguage } from '@uiw/codemirror-extensions-langs';
import { useCodeMirror } from '@uiw/react-codemirror';
import { FC, useEffect, useMemo, useRef, useState } from 'react';

import { CurrentRequest } from '../../model/Request';
import { successToast } from '../../utils';
import { generateHTTPSnippet } from '../../utils/httpsnippet';
import styles from './GenerateCodeTab.module.css';

type Target =
  | 'c'
  | 'clojure'
  | 'csharp'
  | 'go'
  | 'http'
  | 'java'
  | 'javascript'
  | 'kotlin'
  | 'node'
  | 'objc'
  | 'ocaml'
  | 'php'
  | 'powershell'
  | 'python'
  | 'r'
  | 'ruby'
  | 'shell'
  | 'swift';

type Lang =
  | 'apl'
  | 'asciiArmor'
  | 'asterisk'
  | 'c'
  | 'csharp'
  | 'scala'
  | 'solidity'
  | 'kotlin'
  | 'shader'
  | 'nesC'
  | 'objectiveC'
  | 'objectiveCpp'
  | 'squirrel'
  | 'ceylon'
  | 'dart'
  | 'cmake'
  | 'cobol'
  | 'commonLisp'
  | 'crystal'
  | 'cypher'
  | 'd'
  | 'diff'
  | 'dtd'
  | 'dylan'
  | 'ebnf'
  | 'ecl'
  | 'eiffel'
  | 'elm'
  | 'factor'
  | 'fcl'
  | 'forth'
  | 'fortran'
  | 'gas'
  | 'gherkin'
  | 'groovy'
  | 'haskell'
  | 'haxe'
  | 'http'
  | 'idl'
  | 'jinja2'
  | 'mathematica'
  | 'mbox'
  | 'mirc'
  | 'modelica'
  | 'mscgen'
  | 'mumps'
  | 'nsis'
  | 'ntriples'
  | 'octave'
  | 'oz'
  | 'pig'
  | 'properties'
  | 'protobuf'
  | 'puppet'
  | 'q'
  | 'sas'
  | 'sass'
  | 'liquid'
  | 'mermaid'
  | 'nix'
  | 'svelte'
  | 'sieve'
  | 'smalltalk'
  | 'solr'
  | 'sparql'
  | 'spreadsheet'
  | 'stex'
  | 'textile'
  | 'tiddlyWiki'
  | 'tiki'
  | 'troff'
  | 'ttcn'
  | 'turtle'
  | 'velocity'
  | 'verilog'
  | 'vhdl'
  | 'webIDL'
  | 'xQuery'
  | 'yacas'
  | 'z80'
  | 'wast'
  | 'javascript'
  | 'jsx'
  | 'typescript'
  | 'tsx'
  | 'vue'
  | 'angular'
  | 'json'
  | 'html'
  | 'css'
  | 'python'
  | 'markdown'
  | 'xml'
  | 'sql'
  | 'mysql'
  | 'pgsql'
  | 'java'
  | 'rust'
  | 'cpp'
  | 'lezer'
  | 'php'
  | 'go'
  | 'shell'
  | 'lua'
  | 'swift'
  | 'tcl'
  | 'yaml'
  | 'vb'
  | 'powershell'
  | 'brainfuck'
  | 'stylus'
  | 'erlang'
  | 'nginx'
  | 'perl'
  | 'ruby'
  | 'pascal'
  | 'livescript'
  | 'less'
  | 'scheme'
  | 'toml'
  | 'vbscript'
  | 'clojure'
  | 'coffeescript'
  | 'julia'
  | 'dockerfile'
  | 'r';

type StateTarget = {
  displayName: string;
  target: Target;
  client: string;
  language: Lang;
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
    displayName: 'JavaScript: jQuery.ajax',
    target: 'javascript',
    client: 'jquery',
    language: 'javascript',
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
  request: CurrentRequest;
  env: any;
};

const GenerateCodeTab: FC<Props> = ({ request, env }) => {
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
      const code = generateHTTPSnippet(request, target.target, target.client, env);
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
  }, [env, request, target, toast]);

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
