import { styleTags, tags } from '@lezer/highlight';

export const jsonHighlighting = styleTags({
  String: tags.string,
  Number: tags.number,
  'True False': tags.bool,
  PropertyName: tags.propertyName,
  Null: tags.null,
  TemplateString: tags.string,
  PropertyTemplateString: tags.propertyName,
  ',': tags.separator,
  '[ ]': tags.squareBracket,
  StringEnv: tags.bool,
  Env: tags.moduleKeyword,
  Interpolation: tags.moduleKeyword,
  'InterpolationStart InterpolationEnd  EnvStart EnvEnd': tags.moduleKeyword,
  Escape: tags.number,
});
