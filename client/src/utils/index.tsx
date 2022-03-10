import { useColorMode } from '@chakra-ui/react';

function cn(styles: any, name: string, variants?: Array<string>): string {
  const { colorMode } = useColorMode();
  const vs = [...(variants ?? []), colorMode];
  const variantCns = vs.map((v) => styles[`${name}--${v}`]).join(' ');
  return styles[name] + ' ' + variantCns;
}

function getMethodColor(method: string): any {
  switch (method) {
    case 'GET':
      return {
        color: 'var(--chakra-colors-green-500)',
      };
    case 'POST':
      return {
        color: 'var(--chakra-colors-orange-500)',
      };
    case 'PUT':
      return {
        color: 'var(--chakra-colors-blue-500)',
      };
    case 'DELETE':
      return {
        color: 'var(--chakra-colors-red-500)',
      };
  }
}

export { cn, getMethodColor };
