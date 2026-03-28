// src/hooks/useKeyboard.js
import { useEffect } from 'react';

export function useKeyboard(bindings) {
  useEffect(() => {
    const handler = (e) => {
      // Ignore when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      for (const [combo, fn] of Object.entries(bindings)) {
        const parts = combo.toLowerCase().split('+');
        const key = parts[parts.length - 1];
        const needsCtrl = parts.includes('ctrl');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        if (
          e.key.toLowerCase() === key &&
          e.ctrlKey === needsCtrl &&
          e.shiftKey === needsShift &&
          e.altKey === needsAlt
        ) {
          e.preventDefault();
          fn(e);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [bindings]);
}
