import { useEffect } from 'react';

export function useKeyPress(
  callback: () => void,
  key: string,
  ctrl?: boolean,
  shift?: boolean,
): void {
  const handler = (e: KeyboardEvent) => {
    if (key === e.key && (!ctrl || e.ctrlKey) && (!shift || e.shiftKey)) {
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
