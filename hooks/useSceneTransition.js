import { createContext, useContext, useEffect, useRef, useState } from 'react';

const SceneTransitionContext = createContext(null);

// The veil lives above every screen, so it survives detail/history navigation.
export function SceneTransitionProvider({ children }) {
  const [pulse, setPulse] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function transition(commit) {
    clearTimeout(timer.current);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { commit(); return; }
    setPulse(value => value + 1);
    timer.current = setTimeout(commit, 150);
  }
  return <SceneTransitionContext.Provider value={{ transition }}>
    {children}
    {pulse > 0 && <div key={pulse} className="pmselect-transition-veil" aria-hidden="true"/>}
  </SceneTransitionContext.Provider>;
}

export function useSceneTransition() {
  const context = useContext(SceneTransitionContext);
  // Isolated component fixtures may omit the application provider.
  return context || { transition: commit => commit() };
}
