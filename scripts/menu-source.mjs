import { load } from 'cheerio';

export const SOURCE_URL = 'https://halfsaintvegas.com/pages/this-weeks-party-menu';

export function parseMenu(html, fetchedAt) {
  const $ = load(html);
  const root = $('.PageContent.Rte').first();
  if (!root.length || !/THIS WEEK'S PARTY MENU/i.test($('h1').text())) throw new Error('Expected menu page was not found');
  const sections = [{ title: 'Introduction', blocks: [] }];
  let current = sections[0];
  let line = '';
  const flush = () => { const value = line.replace(/\s+/g, ' ').trim(); if (value) current.blocks.push(value); line = ''; };
  function visit(node) {
    if (node.type === 'text') { line += node.data; return; }
    if (node.type !== 'tag') return;
    if (node.name === 'h2') {
      flush();
      current = { title: $(node).text().replace(/\s+/g, ' ').trim(), blocks: [] };
      sections.push(current);
      return;
    }
    if (node.name === 'br') { flush(); return; }
    const block = ['p', 'div', 'li'].includes(node.name);
    if (block) flush();
    for (const child of node.children || []) visit(child);
    if (block) flush();
  }
  for (const node of root[0].children) visit(node);
  flush();
  const events = [];
  const pattern = /^((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\s*-\s*(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))?(?:,?\s+\d{1,2}\/\d{1,2})?)\s*[–—-]\s*(.+)$/i;
  for (const section of sections.filter(s => /^(Dayclubs|Nightclubs|After Parties)$/i.test(s.title))) {
    let venue = null;
    let details = [];
    for (const block of section.blocks) {
      const match = block.match(pattern);
      if (match) {
        events.push({ section: section.title, venue, details: details.join(' ') || null, dateText: match[1], description: match[2] });
      } else if (/^[^a-z]+$/.test(block) && /[A-Z]/.test(block)) {
        venue = block; details = [];
      } else {
        details.push(block);
      }
    }
  }
  if (!['Dayclubs', 'Nightclubs'].every(name => events.some(e => e.section.toLowerCase() === name.toLowerCase() && e.venue))) throw new Error('Menu is incomplete or contains no recognizable events in a main category');
  const selfLink = root.find('a').toArray().find(a => {
    try { return new URL($(a).attr('href'), SOURCE_URL).href.replace(/\/$/, '') === SOURCE_URL; } catch { return false; }
  });
  const week = selfLink && $(selfLink).text().match(/Week Ending\s+(\d{1,2})-(\d{1,2})-(\d{2,4})/i);
  let weekEnding = null;
  if (week) {
    const year = week[3].length === 2 ? 2000 + Number(week[3]) : Number(week[3]);
    const month = Number(week[1]), day = Number(week[2]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day) weekEnding = date.toISOString().slice(0, 10);
  }
  const links = root.find('a[href]').toArray().map(a => ({ text: $(a).text().replace(/\s+/g, ' ').trim(), url: new URL($(a).attr('href'), SOURCE_URL).href })).filter(a => a.text);
  return { sourceUrl: SOURCE_URL, fetchedAt, weekEnding, sections, events, links };
}
