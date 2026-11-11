import test from 'node:test';
import assert from 'node:assert/strict';
import menu from '../data/menu.json' with {type:'json'};
import { summarize, freshness } from '../src/chart-data.js';
test('charts count source entries and do not invent dates for recurring listings', () => {
 const d = summarize(menu.events);
 assert.equal(d.total, menu.events.length);
 assert.equal(d.categories.reduce((a,b)=>a+b,0),d.total);
 assert.equal(d.venues.reduce((a,b)=>a+b.count,0),d.total);
 assert.equal(d.dated+d.recurring,d.total);
 assert.equal(d.weekdays.reduce((a,b)=>a+b,0),d.dated);
 const undated = summarize([{section:'After Parties',dateText:'Monday - Sunday',venue:'Club'}]);
 assert.deepEqual(undated.weekdays,[0,0,0,0,0,0,0]); assert.equal(undated.recurring,1);
});
test('empty filters produce truthful zero data',()=>{const d=summarize([]);assert.equal(d.total,0);assert.deepEqual(d.venues,[]);assert.deepEqual(d.weekdays,[0,0,0,0,0,0,0]);});
test('freshness uses Las Vegas date at viewing time, not build time',()=>{
 assert.equal(freshness({weekEnding:'2026-11-15'},new Date('2026-11-16T07:59:00Z')).warning,false);
 assert.equal(freshness({weekEnding:'2026-11-15'},new Date('2026-11-16T08:01:00Z')).label,'Past menu week');
 assert.equal(freshness({weekEnding:null}).label,'Menu date unknown');
});
