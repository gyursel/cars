import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/auth.js', import.meta.url), 'utf8');
async function auth(secret, id) {
  if (secret) process.env.SESSION_SECRET = secret;
  else delete process.env.SESSION_SECRET;
  return import(`data:text/javascript;base64,${Buffer.from(source + `\n// ${id}`).toString('base64')}`);
}
test('sessions fail closed, reject tampering and expire', async () => {
  const missing = await auth('', 'missing');
  assert.equal(missing.verifySessionToken('123.signature'), false);
  const secured = await auth('a-test-only-secret-with-more-than-32-characters', 'configured');
  const token = secured.createSessionToken();
  assert.equal(secured.verifySessionToken(token), true);
  assert.equal(secured.verifySessionToken(token + '.extra'), false);
  assert.equal(secured.verifySessionToken(token.replace(/^./, '0')), false);
  assert.equal(secured.verifySessionToken('garbage'), false);
  const cookie = secured.buildSessionCookie(token);
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/);
  const original = Date.now;
  try { Date.now = () => original() + 9 * 60 * 60 * 1000; assert.equal(secured.verifySessionToken(token), false); }
  finally { Date.now = original; }
});
