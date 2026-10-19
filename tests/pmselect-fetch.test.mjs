import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/pmselectFetch.js', import.meta.url), 'utf8');
const { fetchPmselectPage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('source fetch rejects foreign hosts, credentials, HTTP and redirect escapes without sending them', async () => {
  const original = global.fetch;
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response('', { status: 302, headers: { location: 'https://example.com/private' } });
  };
  try {
    for (const url of ['http://pmselect.mobile.bg/', 'https://example.com/', 'https://pmselect.mobile.bg.attacker.test/', 'https://user:pass@pmselect.mobile.bg/', 'https://pmselect.mobile.bg:8443/']) {
      await assert.rejects(fetchPmselectPage(url));
    }
    assert.equal(requests.length, 0);
    await assert.rejects(fetchPmselectPage('https://pmselect.mobile.bg/'));
    assert.equal(requests.length, 1);
    assert.equal(requests[0].options.redirect, 'manual');
  } finally { global.fetch = original; }
});

test('source fetch follows same-host relative redirects and returns original response bytes', async () => {
  const original = global.fetch;
  const requests = [];
  global.fetch = async url => {
    requests.push(url);
    return requests.length === 1 ? new Response('', { status: 302, headers: { location: '/listing' } }) : new Response(new Uint8Array([0xc0, 0xc1]), { headers: { 'content-type': 'text/html; charset=windows-1251' } });
  };
  try {
    const response = await fetchPmselectPage('https://pmselect.mobile.bg/');
    assert.deepEqual(requests, ['https://pmselect.mobile.bg/', 'https://pmselect.mobile.bg/listing']);
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [0xc0, 0xc1]);
  } finally { global.fetch = original; }
});

test('both endpoints reject unauthenticated requests before network access', async () => {
  for (const filename of ['debug-pmselect.js', 'import-pmselect.js']) {
    const route = (await readFile(new URL(`../pages/api/${filename}`, import.meta.url), 'utf8'))
      .replace("import { isRequestAuthenticated } from '../../lib/auth';", 'const isRequestAuthenticated = () => false;')
      .replace("import { fetchPmselectPage } from '../../lib/pmselectFetch';", "const fetchPmselectPage = () => { throw new Error('Network must not run'); };");
    const { default: handler } = await import(`data:text/javascript;base64,${Buffer.from(route).toString('base64')}`);
    let status;
    const res = { setHeader() {}, status(value) { status = value; return this; }, json() {} };
    await handler({ method: 'GET', query: {} }, res);
    assert.equal(status, 401);
  }
});
