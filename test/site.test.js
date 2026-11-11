import { test } from 'node:test';
import assert from 'node:assert/strict';
import menu from '../data/menu.json' with { type: 'json' };
import { renderSite, eventDays } from '../src/site.js';

const current = { source: 'github', remoteRead: 'ok' };
const now = new Date('2026-11-10T12:00:00Z');

test('home renders every source event, source link and existing API links', () => {
  const html = renderSite(menu, current, now);
  assert.equal((html.match(/<article class="event-card"/g) || []).length, menu.events.length);
  for (const path of ['/api/menu', '/rss.xml', '/openapi.json']) assert.ok(html.includes(`href="${path}"`));
  assert.ok(html.includes(menu.sourceUrl));
  assert.match(html, /Current menu week/);
  assert.match(html, /Not affiliated with Half Saint/);
});

test('day matching supports single days, ranges and wraparound without inventing dates', () => {
  assert.deepEqual(eventDays('Friday, 11/13'), ['Friday']);
  assert.deepEqual(eventDays('Thursday - Sunday'), ['Thursday', 'Friday', 'Saturday', 'Sunday']);
  assert.deepEqual(eventDays('Friday - Monday'), ['Friday', 'Saturday', 'Sunday', 'Monday']);
  assert.equal(eventDays('Monday - Sunday').length, 7);
  assert.deepEqual(eventDays(null), []);
  assert.deepEqual(eventDays('TBC'), []);
});

test('home clearly labels recurring entries without specific dates', () => {
  const html = renderSite(menu, current, now);
  const count = menu.events.filter(event => !/\d{1,2}\/\d{1,2}/.test(event.dateText || '')).length;
  assert.equal((html.match(/Recurring · dates not specified/g) || []).length, count);
});

test('home explicitly reports fallback, outdated and unknown menu weeks', () => {
  assert.match(renderSite(menu, { source: 'bundled_fallback', remoteRead: 'failed' }, now), /Backup snapshot/);
  assert.match(renderSite({ ...menu, weekEnding: '2026-11-08' }, current, now), /Past menu week/);
  assert.match(renderSite({ ...menu, weekEnding: null }, current, now), /Menu date unknown/);
  assert.match(renderSite({ ...menu, weekEnding: null }, current, now), /Collection time does not establish event dates/);
});

test('home escapes source strings in text and HTML attributes', () => {
  const malicious = '<img src=x onerror="alert(1)">';
  const data = { ...menu, events: [{ section: 'Nightclubs', venue: malicious, description: malicious, details: malicious, dateText: 'Friday' }], sections: [{ title: malicious, blocks: [malicious] }] };
  const html = renderSite(data, current, now);
  assert.ok(!html.includes(malicious));
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
});

test('home retains non-event source sections and useful no-JavaScript content', () => {
  const html = renderSite(menu, current, now);
  assert.match(html, /STRIP CLUB DEALS/);
  assert.match(html, /UPCOMING EVENTS/);
  assert.match(html, /<noscript>/);
  assert.match(html, /id="filters" hidden/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /prefers-reduced-motion/);
});
