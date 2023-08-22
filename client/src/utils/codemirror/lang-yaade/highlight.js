import { styleTags, tags } from '@lezer/highlight';

export const yaadeHighlighting = styleTags({
  Interpolation: tags.moduleKeyword,
  'InterpolationStart InterpolationEnd': tags.moduleKeyword,
});
