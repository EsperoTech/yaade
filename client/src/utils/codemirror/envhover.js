import { EditorView, hoverTooltip } from '@codemirror/view';

import interpolate from '../interpolate';

const wordHover = (env) => {
  return hoverTooltip((view, pos, side) => {
    let { from, to, text } = view.state.doc.lineAt(pos);
    const tree = view.state.tree;
    const node = tree.resolve(pos);
    if (node && (node.name === 'Interpolation' || node.name === 'Env')) {
      let start = node.from;
      let end = node.to;
      if ((start == pos && side < 0) || (end == pos && side > 0)) return null;
      if (!env) {
        return {
          pos: start,
          end,
          above: true,
          strictSide: true,
          create(view) {
            let dom = document.createElement('div');
            dom.className = 'cm-tooltip-cursor';
            dom.textContent = 'NO ENV SELECTED';
            return { dom };
          },
        };
      }
      const envValue = text.slice(start - from, end - from);
      let result = '';
      if (envValue) {
        try {
          const interpolation = interpolate(envValue, env);
          if (interpolation.errors && interpolation.errors.length > 0) {
            result = 'UNKNOWN';
          } else {
            result = interpolation.result;
          }
        } catch (e) {
          result = 'ERROR';
        }
      }
      return {
        pos: start,
        end,
        above: true,
        strictSide: true,
        create(view) {
          let dom = document.createElement('div');
          dom.className = 'cm-tooltip-cursor';
          dom.textContent = result;
          return { dom };
        },
      };
    }
  });
};

const cursorTooltipBaseTheme = EditorView.baseTheme({
  '.cm-tooltip-cursor': {
    backgroundColor: '#66b',
    color: 'white',
    border: 'none',
    padding: '2px 7px',
    borderRadius: '4px',
  },
  '.cm-tooltip': {
    borderRadius: '4px',
    border: 0,
  },
});

export { cursorTooltipBaseTheme, wordHover };
