import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// One selection drives every active indicator. Modes survive manual scrolling,
// while explicit navigation resets them. No observer or wall-clock lock races.
export function useShowroomNavigation(enabled) {
  const [selection, setSelection] = useState({ key: 'home', mode: 'home', request: 0, target: null });
  const locked = useRef(false);
  const lastRequest = useRef(0);
  const release = useRef(() => {});

  function navigate(key) {
    const mode = key === 'search' || key === 'saved' ? key : 'home';
    locked.current = true;
    const activeKey = ['search', 'saved', 'contact'].includes(key) ? key : 'home';
    setSelection(previous => ({ key: activeKey, mode, target: mode !== 'home' ? 'inventory' : key === 'home' ? null : key, request: previous.request + 1 }));
  }

  useLayoutEffect(() => {
    if (!enabled || selection.request === lastRequest.current) return;
    lastRequest.current = selection.request;
    const target = selection.target && document.getElementById(selection.target);
    const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
    if (target) target.scrollIntoView({ behavior, block: 'start' });
    else window.scrollTo({ top: 0, behavior });
    // rAF settling also works on Safari versions without scrollend support.
    let frame;
    let previousY = window.scrollY;
    let stableFrames = 0;
    const settle = () => {
      const y = window.scrollY;
      stableFrames = Math.abs(y - previousY) < 0.5 ? stableFrames + 1 : 0;
      previousY = y;
      if (stableFrames >= 6) { locked.current = false; return; }
      frame = requestAnimationFrame(settle);
    };
    frame = requestAnimationFrame(settle);
    release.current = () => { cancelAnimationFrame(frame); locked.current = false; };
    return () => cancelAnimationFrame(frame);
  }, [enabled, selection.request, selection.target]);

  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      if (locked.current) return;
      const contact = document.getElementById('contact');
      const atContact = contact && (contact.getBoundingClientRect().top <= innerHeight * 0.5 || (window.scrollY > 0 && window.scrollY + innerHeight >= document.documentElement.scrollHeight - 2));
      setSelection(previous => {
        const key = atContact ? 'contact' : previous.mode;
        return key === previous.key ? previous : { ...previous, key };
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(sync); };
    const interrupt = () => { release.current(); onScroll(); };
    const onKey = event => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) interrupt(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', interrupt, { passive: true });
    window.addEventListener('touchstart', interrupt, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      release.current();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', interrupt);
      window.removeEventListener('touchstart', interrupt);
      window.removeEventListener('keydown', onKey);
    };
  }, [enabled]);

  return { activeItem: selection.key, mode: selection.mode, navigate };
}
