import { useColorMode } from '@chakra-ui/react';

function cn(styles: any, name: string, variants?: Array<string>): string {
  const { colorMode } = useColorMode();
  const vs = [...(variants ?? []), colorMode];
  const variantCns = vs.map((v) => styles[`${name}--${v}`]).join(' ');
  return styles[name] + ' ' + variantCns;
}

export { cn };
