import { useLayoutEffect, useState } from 'react';

// Screens retain filter/favourite state; menu anchors still scroll on the home screen.
export function useShowroomNavigation(enabled) {
  const [selection, setSelection] = useState({ key: 'home', mode: 'home', request: 0, target: null });
  function navigate(key) {
    const mode = ['search', 'saved', 'contact'].includes(key) ? key : 'home';
    setSelection(previous => ({ key: mode, mode, target: ['inventory', 'services'].includes(key) ? key : null, request: previous.request + 1 }));
  }
  useLayoutEffect(() => {
    if (!enabled) return;
    const target = selection.target && document.getElementById(selection.target);
    if (target) target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [enabled, selection.request, selection.target]);
  return { activeItem: selection.key, mode: selection.mode, navigate };
}
