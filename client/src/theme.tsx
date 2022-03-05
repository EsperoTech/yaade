import { type ThemeConfig, extendTheme } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  semanticTokens: {
    colors: {
      panelBg: {
        default: 'gray.100',
        _dark: 'gray.900',
      },
      headerBg: {
        default: 'gray.100',
        _dark: 'gray.900',
      },
    },
  },
  shadows: { outline: '0 !important' },
});

export default theme;
