import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneTransition } from '../lib/sceneTransition.mjs';

function fixture() {
  let now = 0, next = 0;
  const jobs = new Map(), states = [], screens = [];
  const transition = createSceneTransition({
    schedule(fn, delay) { const id = ++next; jobs.set(id, { fn, at: now + delay }); return id; },
    clear(id) { jobs.delete(id); }, changed(active) { states.push(active); },
  });
  function advance(ms) {
    const end = now + ms;
    while (true) {
      const first = [...jobs].filter(([,j]) => j.at <= end).sort((a,b) => a[1].at-b[1].at)[0];
      if (!first) break;
      now = first[1].at; jobs.delete(first[0]); first[1].fn();
    }
    now = end;
  }
  return { transition, advance, states, screens };
}

test('rapid taps and double clicks produce one screen change and one fade', () => {
  const f = fixture();
  assert.equal(f.transition.start(() => f.screens.push('search')), true);
  for (let i=0; i<8; i++) assert.equal(f.transition.start(() => f.screens.push('unintended detail')), false);
  f.advance(100);
  assert.deepEqual(f.screens, ['search']);
  assert.equal(f.transition.start(() => f.screens.push('second detail')), false);
  f.advance(220);
  assert.deepEqual(f.states, [true, false]);
  assert.equal(f.transition.start(() => f.screens.push('contact')), true);
  f.advance(320);
  assert.deepEqual(f.screens, ['search', 'contact']);
});

test('history or unmount cancels old work; it cannot reopen a discarded screen', () => {
  const f = fixture();
  f.transition.start(() => f.screens.push('old detail'));
  f.advance(50); f.transition.cancel();
  f.transition.start(() => f.screens.push('home'));
  f.advance(500);
  assert.deepEqual(f.screens, ['home']);
  f.transition.start(() => f.screens.push('after unmount'));
  f.transition.cancel(false); f.advance(500);
  assert.deepEqual(f.screens, ['home']);
});

test('reduced motion commits immediately but ignores the duplicate gesture', () => {
  const f = fixture();
  f.transition.start(() => f.screens.push('saved'), false);
  f.transition.start(() => f.screens.push('duplicate'), false);
  assert.deepEqual(f.screens, ['saved']);
  f.advance(180);
  assert.deepEqual(f.states, [true, false]);
});

test('fast navigation always selects the latest tab and never waits for a fade', () => {
  const f = fixture();
  for (const screen of ['search','saved','contact','home','saved']) {
    f.transition.navigate(() => f.screens.push(screen));
    assert.equal(f.screens.at(-1), screen);
  }
  f.advance(1000);
  assert.deepEqual(f.screens, ['search','saved','contact','home','saved']);
  assert.equal(f.states.includes(true), false);
});

test('navigation supersedes a pending detail and the old detail cannot open later', () => {
  const f = fixture();
  f.transition.start(() => f.screens.push('unwanted detail'));
  f.advance(30);
  f.transition.navigate(() => f.screens.push('contact'));
  f.advance(1000);
  assert.deepEqual(f.screens, ['contact']);
  assert.deepEqual(f.states, [true,false]);
});
