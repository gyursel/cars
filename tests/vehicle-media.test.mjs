import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/vehicleMedia.js', import.meta.url), 'utf8');
const { vehicleImageSource, decodeVehicleImage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const original = 'https://wyzlvhjdghoiqrymkues.supabase.co/storage/v1/object/public/vehicles/photo.jpg?version=2';

test('public assets use bounded display sizes without changing stored source', () => {
  for (const width of [160, 480, 960, 1920]) {
    const rendered = new URL(vehicleImageSource(original, width));
    assert.equal(rendered.searchParams.get('width'), String(width));
    assert.equal(rendered.searchParams.get('version'), '2');
    assert.match(rendered.pathname, /^\/storage\/v1\/render\/image\/public\//);
  }
  for (const source of ['/local.webp', 'data:image/png;base64,abc', 'https://example.com/photo.jpg', 'https://wyzlvhjdghoiqrymkues.supabase.co/storage/v1/object/sign/private.jpg']) assert.equal(vehicleImageSource(source, 480), source);
});

test('failed derivative decodes the original and propagates total image failure', async () => {
  const NativeImage = globalThis.Image;
  const requested = [];
  let failOriginal = false;
  globalThis.Image = class {
    async decode() {
      requested.push(this.src);
      if (this.src.includes('/render/') || failOriginal) throw new Error('simulated image error');
    }
  };
  try {
    assert.equal(await decodeVehicleImage(original, 960), original);
    assert.equal(requested.length, 2);
    failOriginal = true;
    await assert.rejects(decodeVehicleImage(original, 960), /simulated image error/);
  } finally { globalThis.Image = NativeImage; }
});
