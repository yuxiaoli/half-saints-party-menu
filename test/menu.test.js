import test from 'node:test';
import assert from 'node:assert/strict';
import { freshness } from '../src/freshness.js';
import { readFileSync } from 'node:fs';
test('freshness uses Las Vegas date at viewing time, not build time',()=>{
 assert.equal(freshness('2026-11-15',new Date('2026-11-16T07:59:00Z')).warning,false);
 assert.equal(freshness('2026-11-15',new Date('2026-11-16T08:01:00Z')).label,'Past menu week');
 assert.equal(freshness(null).label,'Menu date unknown');
});
test('menu website has no chart dependency or chart bootstrap',()=>{
 const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.equal(pkg.dependencies['chart.js'],undefined);
 const build=readFileSync(new URL('../scripts/build-site.mjs',import.meta.url),'utf8');
 assert.ok(!build.includes('canvas'));assert.ok(!build.includes('charts.js'));
 assert.ok(build.includes('./assets/menu.js'));
});
