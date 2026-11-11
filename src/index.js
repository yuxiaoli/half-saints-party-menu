import menu from '../data/menu.json' with { type: 'json' };
import openapi from '../docs/api/openapi.json' with { type: 'json' };
import { handleRequest } from './api.js';
import { loadSnapshot } from './snapshot.js';

export default {
  async fetch(request) {
    const { menu: selected, snapshot } = await loadSnapshot(fetch, menu);
    return handleRequest(request, selected, new Date(), openapi, snapshot);
  }
};
