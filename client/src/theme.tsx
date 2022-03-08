import { type ThemeConfig, extendTheme } from '@chakra-ui/react';
import { ComponentStyleConfig } from '@chakra-ui/react';

const Menu: ComponentStyleConfig = {
  parts: ['menu'],
  baseStyle: {
    menu: {
      zIndex: 50,
      py: '12',
      background: 'red',
    },
  },
};

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
  components: {
    Menu,
  },
});

export default theme;
