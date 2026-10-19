import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import path from 'node:path';
import { existsSync } from 'node:fs';

// Temporary fixture route imports real UI components, never Firebase or Supabase.
// Every browser request outside localhost is blocked, including analytics writes.
const fixturePath = new URL('../pages/__qa.js', import.meta.url);
const homePath = new URL('../pages/__qa-home.js', import.meta.url);
const homeSource = (await readFile(new URL('../pages/index.js', import.meta.url), 'utf8'))
  .replace("import { db } from '../lib/firebase';", "import { db } from '../tests/fixtures/firestore.mjs';")
  .replace("from 'firebase/firestore'", "from '../tests/fixtures/firestore.mjs'")
  .replace("import { supabase } from '../lib/supabase';", "const supabase = { storage: { from() { throw new Error('Uploads disabled in fixture'); } } };");
await writeFile(homePath, homeSource);
const fixture = await readFile(new URL('./fixtures/showroom-page.txt', import.meta.url), 'utf8');
await writeFile(fixturePath, fixture);
const widths = process.env.QA_WIDTHS ? process.env.QA_WIDTHS.split(',').map(Number) : [360, 375, 390, 430, 768, 1440];
const output = process.env.SCREENSHOT_DIR || path.resolve('work/browser');
await mkdir(output, { recursive: true });
const server = spawn('node', ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3100'], { stdio: 'ignore' });
let browser;
try {
  for (let i = 0; i < 120; i++) {
    try { if ((await fetch('http://127.0.0.1:3100/__qa')).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), args: ['--no-sandbox'] });
  const errors = [];
  const adminWrites = [];
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname !== '127.0.0.1') return route.abort();
    if (url.pathname === '/api/login') return route.fulfill({ contentType: 'application/json', body: '{}' });
    if (url.pathname === '/api/admin-lot') {
      const body = route.request().postDataJSON(); adminWrites.push(body);
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ lot: body.lot }) });
    }
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, body: '{}' });
    if (url.pathname === '/qa-missing.svg') return route.fulfill({ status: 404, body: '' });
    if (url.pathname === '/qa-slow.svg' || url.pathname === '/qa-fast.svg') {
      if (url.pathname.includes('slow')) await new Promise(resolve => setTimeout(resolve, 700));
      return route.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${url.pathname.includes('slow') ? '#a34' : '#39a'}"/></svg>` });
    }
    return route.continue();
  });
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('http://127.0.0.1:3100/__qa');
    await page.getByRole('button', { name: 'Разгледай →', exact: true }).click();
    const nav = page.getByRole('navigation', { name: 'Мобилна навигация' });
    await nav.waitFor();
    // Consecutive programmatic click events avoid Playwright's animation wait.
    const samples = await page.evaluate(async () => {
      const buttons = [...document.querySelectorAll('.apex-bottom-nav button')];
      const samples = [];
      for (const index of [1, 2, 3, 0, 3, 1, 2, 1, 0]) {
        const start = performance.now(); buttons[index].click();
        await new Promise(requestAnimationFrame);
        const active = buttons.filter(button => button.classList.contains('is-active'));
        samples.push({ count: active.length, selected: buttons.indexOf(active[0]), expected: index, ms: performance.now() - start });
      }
      return samples;
    });
    samples.forEach(sample => { assert.equal(sample.count, 1); assert.equal(sample.selected, sample.expected); });
    assert.equal(await nav.locator('[aria-current="page"]').count(), 1);
    await page.waitForTimeout(650);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}`);
    await nav.getByRole('button', { name: 'Контакти', exact: true }).click();
    await page.waitForTimeout(900);
    assert.equal(await nav.locator('.is-active').getAttribute('aria-label'), 'Контакти');
    await page.mouse.wheel(0, -10000);
    await page.waitForTimeout(900);
    assert.equal(await nav.locator('.is-active').getAttribute('aria-label'), 'Контакти', 'contact is a screen, not a scroll-spy section');
    await nav.getByRole('button', { name: 'Начало', exact: true }).click();
    await page.waitForTimeout(550);
    const navRect = await nav.boundingBox();
    assert.ok(navRect.y >= 0 && navRect.y + navRect.height <= 900, 'navigation stays in viewport');
    await page.locator('#inventory').scrollIntoViewIfNeeded();
    const title = page.locator('.apex-car h3').first();
    const dimensions = await title.evaluate(element => ({ height: element.clientHeight, line: parseFloat(getComputedStyle(element).lineHeight), name: element.textContent, title: element.title }));
    assert.ok(dimensions.height <= dimensions.line * 2 + 1);
    assert.ok(dimensions.title.includes(dimensions.name), 'full imported title remains available');
    await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(output, `showroom-${width}.png`), fullPage: true });
    console.log(`PASS ${width}px: navigation, rapid taps, screen persistence, fixed nav, title clamp, overflow; max sampled response ${Math.max(...samples.map(s => s.ms)).toFixed(1)}ms`);
  }
  await page.getByRole('button', { name: 'Меню', exact: true }).click();
  await page.getByRole('navigation', { name: 'Меню', exact: true }).getByRole('button', { name: 'Услуги' }).click();
  assert.equal(await page.locator('.apex-bottom-nav .is-active').count(), 1);
  await page.locator('.apex-car .car-link').first().click();
  const photo = page.locator('.photo-expand .gallery-image-frame');
  await photo.waitFor();
  const initial = await photo.getAttribute('src');
  await page.getByRole('button', { name: 'Снимка 2', exact: true }).click();
  assert.equal(await photo.getAttribute('src'), initial, 'keep decoded frame during slow load');
  await page.getByRole('button', { name: 'Снимка 3', exact: true }).click();
  await page.waitForTimeout(1000);
  assert.equal(await photo.getAttribute('src'), '/qa-fast.svg', 'latest request wins');
  await page.getByRole('button', { name: 'Снимка 4', exact: true }).click();
  await page.locator('.photo-expand [role="status"]').waitFor();
  assert.equal(await photo.getAttribute('src'), '/qa-fast.svg', 'failed request keeps last image');
  await page.getByRole('button', { name: 'Снимка 1', exact: true }).click();
  await page.locator('.photo-expand').click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await page.locator('.photo-expand').evaluate(element => element === document.activeElement), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.apex-detail').evaluate(element => getComputedStyle(element).animationName), 'none');
  await page.getByRole('button', { name: '← Към колекцията', exact: true }).click();
  await page.getByRole('navigation', { name: 'Мобилна навигация' }).getByRole('button', { name: 'Търсене и филтри' }).click();
  await page.getByRole('textbox', { name: 'Търси марка или модел' }).fill('няма такъв автомобил');
  await page.getByRole('heading', { name: 'Няма съвпадения' }).waitFor();
  // A saved car remains reachable even while search has no matches.
  await page.getByRole('navigation', { name: 'Мобилна навигация' }).getByRole('button', { name: 'Начало', exact: true }).click();
  await page.locator('.apex-car .save-car').first().click();
  await page.getByRole('navigation', { name: 'Мобилна навигация' }).getByRole('button', { name: 'Любими автомобили' }).click();
  await page.getByRole('heading', { name: 'Любими', exact: true }).waitFor();
  assert.equal(await page.locator('.apex-car').count(), 1);
  await page.locator('.apex-car .save-car').click();
  assert.equal(await page.locator('.apex-car').count(), 0);
  await page.getByRole('navigation', { name: 'Мобилна навигация' }).getByRole('button', { name: 'Търсене и филтри' }).click();
  await page.getByRole('heading', { name: 'Няма съвпадения' }).waitFor();
  // Exercise the real Home source with only service imports replaced by mocks.
  await page.goto('http://127.0.0.1:3100/__qa-home');
  await page.getByRole('button', { name: 'Разгледай →', exact: true }).click();
  await page.locator('.apex-car .car-link').click();
  await page.locator('.apex-detail').waitFor();
  assert.equal(new URL(page.url()).hash, '#vehicle');
  await page.goBack();
  await page.locator('.apex-bottom-nav').waitFor();
  await page.goForward();
  await page.locator('.apex-detail').waitFor();
  await page.getByRole('button', { name: '← Към колекцията', exact: true }).click();
  await page.locator('.apex-bottom-nav').waitFor();
  await page.goto('http://127.0.0.1:3100/__qa-home#admin');
  await page.locator('.apex-login').waitFor();
  await page.locator('.apex-login input').fill('fixture-password-only');
  await page.getByRole('button', { name: 'Влез в администрацията ↗', exact: true }).click();
  await page.locator('.apex-admin').waitFor();
  const price = page.getByRole('textbox', { name: 'Цена €', exact: true });
  await price.fill('36000');
  await page.locator('.admin-savebar button').click();
  await page.waitForTimeout(300);
  assert.equal(adminWrites.length, 1);
  assert.equal(adminWrites[0].lot.sections[0].cars[0].catalogId, 'mock-vehicle-1');
  assert.equal(adminWrites[0].lot.sections[0].cars[0].price, '36000');
  assert.deepEqual(adminWrites[0].lot.sections[0].cars[0].images, ['/apex-hero.webp', '/qa-fast.svg']);
  console.log('PASS Home with mocked services: browser Back/Forward, detail return, /#admin, login, vehicle edit/save, IDs and gallery preservation');
  assert.deepEqual(errors, []);
  console.log('PASS gallery: slow/racing/failed images, fullscreen keys, Escape/focus, detail return, reduced motion, filtering; zero page errors');
} finally {
  await browser?.close(); server.kill('SIGTERM'); await unlink(fixturePath); await unlink(homePath);
}
