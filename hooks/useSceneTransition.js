import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createSceneTransition } from '../lib/sceneTransition.mjs';

const SceneTransitionContext = createContext(null);

// Keep one veil alive and intercept pointer input until the screen has settled.
export function SceneTransitionProvider({ children }) {
  const [active, setActive] = useState(false);
  const controller = useRef(null);
  if (!controller.current) controller.current = createSceneTransition({ changed: setActive });
  useEffect(() => {
    const cancel = () => controller.current.cancel();
    window.addEventListener('popstate', cancel);
    window.addEventListener('hashchange', cancel);
    return () => {
      window.removeEventListener('popstate', cancel);
      window.removeEventListener('hashchange', cancel);
      controller.current.cancel(false);
    };
  }, []);
  const context = useMemo(() => ({
    transition: commit => controller.current.start(commit, !matchMedia('(prefers-reduced-motion: reduce)').matches),
  }), []);
  return <SceneTransitionContext.Provider value={context}>
    {children}
    {active && <div className="pmselect-transition-veil" aria-hidden="true"/>}
  </SceneTransitionContext.Provider>;
}

export function useSceneTransition() {
  return useContext(SceneTransitionContext) || { transition: commit => { commit(); return true; } };
}
