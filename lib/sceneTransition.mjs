// One accepted gesture per transition; browser history can cancel queued work.
export function createSceneTransition({ schedule = setTimeout, clear = clearTimeout, changed = () => {} } = {}) {
  let busy = false;
  let version = 0;
  let timers = [];
  function cancel(notify = true) {
    version++;
    timers.forEach(clear);
    timers = [];
    busy = false;
    if (notify) changed(false);
  }
  function start(commit, animate = true) {
    if (busy) return false;
    busy = true;
    const current = ++version;
    changed(true);
    const apply = () => {
      if (version !== current) return;
      try { commit(); } catch (error) { cancel(); throw error; }
    };
    if (animate) timers.push(schedule(apply, 100));
    else apply();
    if (version === current) timers.push(schedule(() => cancel(), animate ? 320 : 180));
    return true;
  }
  function navigate(commit) {
    // Navigation is immediate and latest-wins, including over a queued detail.
    cancel();
    commit();
    return true;
  }
  return { start, cancel, navigate };
}
