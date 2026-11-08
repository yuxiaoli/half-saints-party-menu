import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseMenu, SOURCE_URL } from './menu-source.mjs';

export async function syncMenu({ path = 'data/menu.json', fetchImpl = fetch } = {}) {
  const response = await fetchImpl(SOURCE_URL, { headers: { 'User-Agent': 'HalfSaintsMenuSync/1.0' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const html = await response.text();
  const menu = parseMenu(html, new Date().toISOString());
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(menu, null, 2) + '\n', 'utf8');
    await rename(temporary, target);
  } finally { await rm(temporary, { force: true }); }
  return menu;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const menu = await syncMenu();
    console.log(`Synchronized ${menu.events.length} events from ${menu.sourceUrl} at ${menu.fetchedAt}`);
  } catch (error) {
    console.error(`Menu synchronization failed; previous data retained: ${error.message}`);
    process.exitCode = 1;
  }
}
