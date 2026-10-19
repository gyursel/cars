import { useEffect, useRef, useState } from 'react';

// One cancellable transition: rapid taps always commit the latest destination.
export function useSceneTransition() {
  const [pulse, setPulse] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function transition(commit) {
    clearTimeout(timer.current);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { commit(); return; }
    setPulse(value => value + 1);
    timer.current = setTimeout(commit, 150);
  }
  return { pulse, transition };
}
