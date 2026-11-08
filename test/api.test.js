import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleRequest } from '../src/api.js';

const menu = { sourceUrl: 'https://example.com/menu', fetchedAt: '2026-11-09T00:00:00Z', weekEnding: null, sections: [{ title: 'Events', blocks: ['A & B'] }], events: [{ section: 'Events', venue: 'A & B', details: null, dateText: null, description: 'Party <night>' }] };

test('JSON endpoint returns source data and truthful freshness metadata', async () => {
  const response = await handleRequest(new Request('https://example.com/api/menu'), menu, new Date('2026-11-10T00:00:00Z'));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.data, menu);
  assert.equal(result.freshness.ageSeconds, 86400);
  assert.equal(result.freshness.weekEnding, null);
  assert.equal(result.freshness.status, 'unknown');
});

test('freshness compares the source week ending with the Las Vegas calendar date', async () => {
  const dated = { ...menu, weekEnding: '2026-11-09' };
  const current = await handleRequest(new Request('https://example.com/api/menu'), dated, new Date('2026-11-10T07:00:00Z'));
  assert.equal((await current.json()).freshness.status, 'not_past_week_ending');
  const past = await handleRequest(new Request('https://example.com/api/menu'), dated, new Date('2026-11-10T08:01:00Z'));
  assert.equal((await past.json()).freshness.status, 'past_week_ending');
});

test('RSS escapes event text and does not invent a publication date', async () => {
  const response = await handleRequest(new Request('https://example.com/rss.xml'), menu);
  assert.match(response.headers.get('content-type'), /application\/rss\+xml/);
  const rss = await response.text();
  assert.match(rss, /<title>A &amp; B<\/title>/);
  assert.match(rss, /Party &lt;night&gt;/);
  assert.doesNotMatch(rss, /<pubDate>/);
});

test('unknown routes and unsupported methods are rejected', async () => {
  assert.equal((await handleRequest(new Request('https://example.com/missing'), menu)).status, 404);
  assert.equal((await handleRequest(new Request('https://example.com/api/menu', { method: 'POST' }), menu)).status, 405);
});


import { loadSnapshot } from '../src/snapshot.js';
test('uses the bundled snapshot and reports a remote read failure', async () => {
  const result = await loadSnapshot(async () => new Response('bad', { status: 503 }), menu);
  assert.deepEqual(result.menu, menu);
  assert.deepEqual(result.snapshot, { source: 'bundled_fallback', remoteRead: 'failed' });
});

test('rejects empty or invalid remote snapshots and accepts valid ones', async () => {
  const response = data => async () => Response.json(data);
  for (const invalid of [{}, { ...menu, events: [] }, { ...menu, fetchedAt: 'invalid' }]) {
    assert.equal((await loadSnapshot(response(invalid), menu)).snapshot.source, 'bundled_fallback');
  }
  assert.equal((await loadSnapshot(response(menu), menu)).snapshot.source, 'github');
});

test('API and feed expose when bundled fallback is used', async () => {
  const status = { source: 'bundled_fallback', remoteRead: 'failed' };
  const response = await handleRequest(new Request('https://example.com/api/menu'), menu, new Date(), {}, status);
  assert.deepEqual((await response.json()).snapshot, status);
  const feed = await handleRequest(new Request('https://example.com/rss.xml'), menu, new Date(), {}, status);
  assert.match(await feed.text(), /Remote snapshot read failed; using bundled fallback/);
});

test('OpenAPI endpoint serves the supplied specification', async () => {
  const doc = { openapi: '3.1.0', paths: {} };
  const response = await handleRequest(new Request('https://example.com/openapi.json'), menu, new Date(), doc);
  assert.deepEqual(await response.json(), doc);
});
