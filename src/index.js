import menu from '../data/menu.json' with { type: 'json' };
import openapi from '../docs/api/openapi.json' with { type: 'json' };
import { handleRequest } from './api.js';
import { loadSnapshot } from './snapshot.js';
import { renderSite } from './site.js';

export default {
  async fetch(request) {
    const { menu: selected, snapshot } = await loadSnapshot(fetch, menu);
    const pathname = new URL(request.url).pathname;
    if (pathname === '/' && ['GET', 'HEAD'].includes(request.method)) {
      return new Response(request.method === 'HEAD' ? null : renderSite(selected, snapshot), {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' }
      });
    }
    return handleRequest(request, selected, new Date(), openapi, snapshot);
  }
};
