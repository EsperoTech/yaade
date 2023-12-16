import parseCurl from 'parse-curl';

export function parseCurlCommand(curlCommand) {
  return parseCurl(curlCommand);
}
