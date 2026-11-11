# Half Saints menu and charts

A source-backed snapshot of the [Half Saint weekly party menu](https://halfsaintvegas.com/pages/this-weeks-party-menu), with a GitHub Pages menu/chart website and a separate existing Cloudflare API. The source can contain past dates or change structure; the service reports what was observed rather than asserting that it is current. It is not affiliated with Half Saint.

## Existing API service (unchanged)

- `GET /api/menu` — structured menu and freshness metadata.
- `GET /rss.xml` — RSS feed.
- `GET /openapi.json` — OpenAPI description; the source is `docs/api/openapi.json`.

See the OpenAPI document for response fields and examples. The original wording and conditions are retained in the snapshot; check the source before making plans.

## Sync and operations

`npm ci`, `npm test`, `npm run sync`, and `npm run build` run the tests, fetch and validate the menu, and build the Pages advanced-mode Worker. Node.js 22 or newer is required. A failed fetch or validation exits unsuccessfully without replacing `data/menu.json`. The GitHub Actions workflow runs every Monday at 18:17 UTC and can be run manually. It commits only a validated snapshot; failures are visible in Actions and the run summary. GitHub may delay scheduled runs.

The deployed Worker reads the latest committed snapshot from this public repository. If it cannot retrieve or validate it, it falls back to the snapshot bundled at deployment and exposes that condition. That fallback may be older than the latest successful sync. The current source's week-ending date, when explicitly linked from the source, is used for freshness; absence of that evidence is reported as unknown. Fetch time is not proof that the menu itself has been updated.

To change Worker code, run `npm run build` and deploy the resulting `dist` directory to the Cloudflare Pages project `half-saints-party-menu`. The weekly data update does not require a Cloudflare API token.

## GitHub Pages menu and charts

`npm run build:site` generates `site-dist/`: a static menu, local JSON snapshot, RSS and self-hosted Chart.js 4.5.1. No Cloudflare service, KV, secrets or external chart CDN is needed by this website. The existing API/RSS service code and source collector are preserved.

The browser draws weekday, party-type and venue charts from `data/menu.json`. Charts can use the full menu or the active lineup filters. Weekday counts exclude recurring/undated entries rather than assigning invented dates. Charts include readable counts and loading/error/retry states. The browser recalculates menu freshness using the current Las Vegas date. With JavaScript disabled, all published menu cards remain readable.

`Deploy menu website` publishes via GitHub Pages Actions after a relevant main-branch push or successful `Weekly menu sync`, and also supports manual deployment without another crawl. The collector's existing Monday 18:17 UTC cron is unchanged; there is no additional schedule. `workflow_run` is needed because commits made by the collector's GITHUB_TOKEN do not trigger a second push workflow. Failed collection does not replace the last published menu.

Pages must be configured to use GitHub Actions. The build uses relative asset/data/feed paths, including under the repository project path. Before release, run `npm ci && npm test && npm run build:site`, inspect the published URL and test filtering and charts at mobile and desktop widths.
