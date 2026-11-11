# Half Saints party menu

A source-backed snapshot of the [Half Saint weekly party menu](https://halfsaintvegas.com/pages/this-weeks-party-menu), with a GitHub Pages menu website and a separate existing Cloudflare API. The source can contain past dates or change structure; the service reports what was observed rather than asserting that it is current. It is not affiliated with Half Saint.

## Existing API service (unchanged)

- `GET /api/menu` — structured menu and freshness metadata.
- `GET /rss.xml` — RSS feed.
- `GET /openapi.json` — OpenAPI description; the source is `docs/api/openapi.json`.

See the OpenAPI document for response fields and examples. The original wording and conditions are retained in the snapshot; check the source before making plans.

## Sync and operations

`npm ci`, `npm test`, `npm run sync`, and `npm run build` run the tests, fetch and validate the menu, and build the Pages advanced-mode Worker. Node.js 22 or newer is required. A failed fetch or validation exits unsuccessfully without replacing `data/menu.json`. The GitHub Actions workflow runs every Monday at 18:17 UTC and can be run manually. It commits only a validated snapshot; failures are visible in Actions and the run summary. GitHub may delay scheduled runs.

The deployed Worker reads the latest committed snapshot from this public repository. If it cannot retrieve or validate it, it falls back to the snapshot bundled at deployment and exposes that condition. That fallback may be older than the latest successful sync. The current source's week-ending date, when explicitly linked from the source, is used for freshness; absence of that evidence is reported as unknown. Fetch time is not proof that the menu itself has been updated.

To change Worker code, run `npm run build` and deploy the resulting `dist` directory to the Cloudflare Pages project `half-saints-party-menu`. The weekly data update does not require a Cloudflare API token.

## GitHub Pages menu website

`npm run build:site` generates `site-dist/`: a responsive, source-backed menu, local JSON snapshot and RSS. The website contains no charts or chart-library dependencies and requires no Cloudflare resources, secrets or external CDN. The existing API/RSS service code and source collector are preserved.

Party-type and weekday buttons, search, reset and shareable URL filters make the original listings easy to browse. Each card retains the original artist, venue, date wording, entry conditions and source link. Recurring entries are explicitly marked without assigning invented dates. The browser recalculates freshness using the current Las Vegas date. With JavaScript disabled, all published menu cards remain readable.

`Deploy menu website` publishes after a relevant main-branch push or successful `Weekly menu sync`, and supports manual deployment without another crawl. The existing Monday 18:17 UTC cron is unchanged; there is no additional schedule. The workflow_run trigger handles successful snapshot commits made by GITHUB_TOKEN. Failed collection retains the last successful snapshot and published menu.

GitHub Pages uses Actions at https://yuxiaoli.github.io/half-saints-party-menu/ . The build uses relative asset/data/feed paths. Verify with `npm ci && npm test && npm run build:site` and desktop/mobile browser checks.
