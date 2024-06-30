import { useEffect } from 'react';

export function useKeyPress(
  callback: () => void,
  key: string,
  ctrl?: boolean,
  shift?: boolean,
): void {
  const handler = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmd = isMac ? e.metaKey : e.ctrlKey;
    if (key === e.key && (!ctrl || cmd) && (!shift || e.shiftKey)) {
      e.preventDefault();
      callback();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  });
}
