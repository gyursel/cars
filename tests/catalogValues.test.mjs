import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/catalogValues.js', import.meta.url), 'utf8');
const { yearOf, imagesOf } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
test('imported production dates sort alongside manually entered years', () => {
  const cars = [{ year: '2020' }, { productionDate: 'март 2023 г.' }, { productionDate: '2019' }];
  assert.deepEqual(cars.sort((a, b) => yearOf(b) - yearOf(a)).map(yearOf), [2023, 2020, 2019]);
  assert.equal(yearOf({}), 0);
});
test('legacy malformed galleries do not crash the showroom', () => {
  assert.deepEqual(imagesOf({ image: 'cover.jpg', images: {} }), ['cover.jpg']);
  assert.deepEqual(imagesOf({ image: 'cover.jpg', images: ['cover.jpg', null, 42, ' ', 'second.jpg'] }), ['cover.jpg', 'second.jpg']);
  assert.equal(imagesOf({ images: Array.from({ length: 20 }, (_, i) => `${i}.jpg`) }).length, 15);
});
