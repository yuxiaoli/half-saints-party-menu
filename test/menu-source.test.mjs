import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMenu } from '../scripts/menu-source.mjs';
import { syncMenu } from '../scripts/sync-menu.mjs';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('extracts source sections and events without inventing a date', () => {
  const html = `<h1>THIS WEEK'S PARTY MENU</h1><div class="PageContent Rte"><p>Confirmation required.</p><h2>Dayclubs</h2><p>EXAMPLE @HOTEL<br>Free entry.<br>Friday, 11/6 – DJ Example</p><h2>Nightclubs</h2><p>CLUB<br>Saturday – Open format</p></div>`;
  const menu = parseMenu(html, '2026-11-08T12:00:00.000Z');
  assert.equal(menu.weekEnding, null);
  assert.deepEqual(menu.sections[0], { title: 'Introduction', blocks: ['Confirmation required.'] });
  assert.deepEqual(menu.events[0], { section: 'Dayclubs', venue: 'EXAMPLE @HOTEL', details: 'Free entry.', dateText: 'Friday, 11/6', description: 'DJ Example' });
});

test('rejects a partial page so it cannot replace a successful snapshot', () => {
  assert.throws(() => parseMenu(`<h1>THIS WEEK'S PARTY MENU</h1><div class="PageContent Rte"><h2>Dayclubs</h2></div>`, '2026-11-08T12:00:00.000Z'), /incomplete/i);
});

test('rejects a page with an empty main category', () => {
  const html = `<h1>THIS WEEK'S PARTY MENU</h1><div class="PageContent Rte"><h2>Dayclubs</h2><p>VENUE<br>Friday – Party</p><h2>Nightclubs</h2></div>`;
  assert.throws(() => parseMenu(html, '2026-11-08T12:00:00.000Z'), /incomplete/i);
});

test('preserves the previous snapshot on failed fetch', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'menu-test-'));
  try {
    const path = join(dir, 'menu.json');
    await writeFile(path, 'previous successful snapshot');
    await assert.rejects(syncMenu({ path, fetchImpl: async () => new Response('unavailable', { status: 503 }) }), /503/);
    assert.equal(await readFile(path, 'utf8'), 'previous successful snapshot');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('preserves the previous snapshot when a successful HTTP response has incomplete content', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'menu-test-'));
  try {
    const path = join(dir, 'menu.json');
    await writeFile(path, 'previous successful snapshot');
    await assert.rejects(syncMenu({ path, fetchImpl: async () => new Response('<h1>Service unavailable</h1>') }), /menu page/i);
    assert.equal(await readFile(path, 'utf8'), 'previous successful snapshot');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
