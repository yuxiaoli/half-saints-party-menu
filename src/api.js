const xml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

function rss(menu, snapshot) {
  const items = menu.events.map(event => {
    const title = event.venue || event.section || 'Menu item';
    const description = [event.dateText, event.details, event.description].filter(Boolean).join(' — ');
    const guid = JSON.stringify(event);
    return `<item><title>${xml(title)}</title><link>${xml(menu.sourceUrl)}</link><guid isPermaLink="false">${xml(guid)}</guid><description>${xml(description)}</description></item>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Half Saints weekly party menu</title><link>${xml(menu.sourceUrl)}</link><description>Events from the Half Saints weekly party menu. ${snapshot.remoteRead === 'failed' ? 'Remote snapshot read failed; using bundled fallback.' : 'Snapshot loaded from GitHub.'}</description><lastBuildDate>${new Date(menu.fetchedAt).toUTCString()}</lastBuildDate>${items}</channel></rss>`;
}

export function handleRequest(request, menu, now = new Date(), openapi = {}, snapshot = { source: 'github', remoteRead: 'ok' }) {
  const headers = { 'Access-Control-Allow-Origin': '*' };
  const path = new URL(request.url).pathname;
  if (!['/api/menu', '/rss.xml', '/openapi.json'].includes(path)) return new Response('Not found', { status: 404, headers });
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET' } });
  if (path === '/openapi.json') return Response.json(openapi, { headers });
  if (path === '/rss.xml') {
    return new Response(rss(menu, snapshot), { headers: { ...headers, 'Content-Type': 'application/rss+xml; charset=utf-8' } });
  }
  const fetched = Date.parse(menu.fetchedAt);
  const ageSeconds = Number.isFinite(fetched) ? Math.max(0, Math.floor((now.getTime() - fetched) / 1000)) : null;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const status = menu.weekEnding ? (today <= menu.weekEnding ? 'not_past_week_ending' : 'past_week_ending') : 'unknown';
  const result = { data: menu, snapshot, freshness: { ageSeconds, weekEnding: menu.weekEnding, status } };
  return Response.json(result, { headers });
}



