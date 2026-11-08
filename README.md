# Half Saints party menu API

A source-backed snapshot of the [Half Saint weekly party menu](https://halfsaintvegas.com/pages/this-weeks-party-menu), served on Cloudflare Pages. The source can contain past dates or change structure; the service reports what was observed rather than asserting that it is current. It is not affiliated with Half Saint.

## API

- `GET /api/menu` — structured menu and freshness metadata.
- `GET /rss.xml` — RSS feed.
- `GET /openapi.json` — OpenAPI description; the source is `docs/api/openapi.json`.

See the OpenAPI document for response fields and examples. The original wording and conditions are retained in the snapshot; check the source before making plans.

## Sync and operations

`npm ci`, `npm test`, `npm run sync`, and `npm run build` run the tests, fetch and validate the menu, and build the Pages advanced-mode Worker. Node.js 22 or newer is required. A failed fetch or validation exits unsuccessfully without replacing `data/menu.json`. The GitHub Actions workflow runs every Monday at 18:17 UTC and can be run manually. It commits only a validated snapshot; failures are visible in Actions and the run summary. GitHub may delay scheduled runs.

The deployed Worker reads the latest committed snapshot from this public repository. If it cannot retrieve or validate it, it falls back to the snapshot bundled at deployment and exposes that condition. That fallback may be older than the latest successful sync. The current source's week-ending date, when explicitly linked from the source, is used for freshness; absence of that evidence is reported as unknown. Fetch time is not proof that the menu itself has been updated.

To change Worker code, run `npm run build` and deploy the resulting `dist` directory to the Cloudflare Pages project `half-saints-party-menu`. The weekly data update does not require a Cloudflare API token.
