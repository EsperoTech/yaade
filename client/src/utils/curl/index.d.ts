declare type ParsedCurlCommand = {
  method?: string;
  url?: string;
  header: {
    [key: string]: string;
  };
  body?: string;
};

declare function parseCurlCommand(curlCommand: string): ParsedCurlCommand;

export { parseCurlCommand };
