const SNAPSHOT_URL = 'https://raw.githubusercontent.com/yuxiaoli/half-saints-party-menu/main/data/menu.json';
function validMenu(data) {
  const nullableString = value => value === null || typeof value === 'string';
  return data && typeof data.sourceUrl === 'string' && /^https:\/\//.test(data.sourceUrl)
    && typeof data.fetchedAt === 'string' && Number.isFinite(Date.parse(data.fetchedAt))
    && (data.weekEnding === null || (typeof data.weekEnding === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.weekEnding)))
    && Array.isArray(data.sections) && data.sections.length > 0
    && data.sections.every(section => section && typeof section.title === 'string' && Array.isArray(section.blocks) && section.blocks.length > 0 && section.blocks.every(block => typeof block === 'string' && block.trim()))
    && Array.isArray(data.events) && data.events.length > 0
    && data.events.every(event => event && ['section', 'venue', 'details', 'dateText', 'description'].every(key => nullableString(event[key])));
}
export async function loadSnapshot(fetcher, bundled) {
  try {
    const response = await fetcher(SNAPSHOT_URL, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error('Remote read failed');
    const menu = await response.json();
    if (!validMenu(menu)) throw new Error('Invalid remote snapshot');
    return { menu, snapshot: { source: 'github', remoteRead: 'ok' } };
  } catch {
    return { menu: bundled, snapshot: { source: 'bundled_fallback', remoteRead: 'failed' } };
  }
}
