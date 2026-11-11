import Chart from 'chart.js/auto';
import { summarize, freshness, DAYS, CATEGORIES } from './chart-data.js';
const status = document.querySelector('#chart-status');
const retry = document.querySelector('#chart-retry');
const figures = document.querySelector('#chart-figures');
const charts = [];
let menu;
let filtered = false;
Chart.defaults.font.family = 'Arial, Helvetica, sans-serif';
Chart.defaults.color = '#62635b';
Chart.defaults.borderColor = '#deddd3';
const colors = ['#899b24', '#7a6cab', '#cf8352'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const common = { responsive: true, maintainAspectRatio: false, animation: reduced ? false : { duration: 250 }, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1b1b19', padding: 12 } } };
function refreshFreshness(snapshot = menu) {
  const state = freshness(snapshot);
  const bar = document.querySelector('.menu-status');
  bar.classList.toggle('status-warning', state.warning);
  bar.querySelector('strong').textContent = state.label;
  let explanation = bar.querySelector('.status-explanation');
  if (!explanation) { explanation = document.createElement('p'); explanation.className = 'status-explanation'; bar.append(explanation); }
  explanation.textContent = state.explanation;
}
function render() {
  if (!menu) return;
  const visible = [...document.querySelectorAll('.event-card')].map((card, index) => !card.hidden ? index : -1);
  const events = filtered ? menu.events.filter((_, index) => visible.includes(index)) : menu.events;
  const data = summarize(events);
  charts.forEach(chart => chart.destroy()); charts.length = 0;
  const scope = filtered ? 'Filtered lineup' : 'Full menu';
  document.querySelector('#chart-summary').textContent = `${scope}: ${data.total} listings across ${data.venues.length} venues. ${data.dated} dated listings; ${data.recurring} recurring or undated listings.`;
  document.querySelector('#weekday-note').textContent = `${data.dated} dated listings only. ${data.recurring} recurring or undated listings excluded. Counts are listings, not unique parties or attendance.`;
  const scales = { x: { grid: { display: false }, border: { color: '#9d9e92' } }, y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Listings' }, border: { display: false } } };
  charts.push(new Chart(document.querySelector('#weekday-chart'), { type: 'bar', data: { labels: DAYS.map(d => d.slice(0, 3)), datasets: [{ label: 'Dated listings', data: data.weekdays, backgroundColor: '#7a6cab', borderRadius: 2, maxBarThickness: 42 }] }, options: { ...common, scales } }));
  charts.push(new Chart(document.querySelector('#category-chart'), { type: 'doughnut', data: { labels: CATEGORIES, datasets: [{ label: 'Listings', data: data.categories, backgroundColor: colors, borderColor: '#fcfaf5', borderWidth: 4 }] }, options: { ...common, cutout: '68%', plugins: { ...common.plugins, legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 16, font: { size: 11 } } } } } }));
  document.querySelector('#venue-frame').style.height = `${Math.max(220, data.venues.length * 30 + 45)}px`;
  charts.push(new Chart(document.querySelector('#venue-chart'), { type: 'bar', data: { labels: data.venues.map(v => innerWidth < 500 && v.name.includes('@') ? [v.name.split('@')[0].trim(), '@' + v.name.split('@').slice(1).join('@')] : v.name), datasets: [{ label: 'Listings', data: data.venues.map(v => v.count), backgroundColor: '#899b24', borderRadius: 2, maxBarThickness: 18 }] }, options: { ...common, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: 'Listings' }, border: { display: false } }, y: { grid: { display: false }, ticks: { font: { size: innerWidth < 500 ? 9 : 10 } }, border: { display: false } } } } }));
  const readable = document.querySelector('#chart-data'); readable.replaceChildren();
  [['Dated listings by weekday', DAYS.map((d, i) => `${d}: ${data.weekdays[i]}`)], ['Listings by party type', CATEGORIES.map((c, i) => `${c}: ${data.categories[i]}`)], ['Listings by venue', data.venues.map(v => `${v.name}: ${v.count}`)]].forEach(([title, values]) => { const p = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = title; p.append(strong, document.createElement('br'), document.createTextNode(values.join(' �� '))); readable.append(p); });
}
async function load() {
  status.textContent = 'Loading the published menu snapshot��'; retry.hidden = true;
  try {
    const response = await fetch('./data/menu.json', { cache: 'no-cache', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('snapshot unavailable');
    const value = await response.json();
    if (!Array.isArray(value.events) || !value.events.length || !Number.isFinite(Date.parse(value.fetchedAt))) throw new Error('invalid snapshot');
    if (value.fetchedAt !== document.querySelector('#charts').dataset.snapshot) throw new Error('snapshot changed during deployment; reload this page');
    menu = value; refreshFreshness(); figures.hidden = false; render();
    status.textContent = `Snapshot collected ${new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Los_Angeles' }).format(new Date(menu.fetchedAt))} �� Las Vegas time. Hover or tap a chart to inspect counts.`;
  } catch (error) {
    status.textContent = menu ? 'Refresh failed. Keeping the last successfully loaded charts and collection timestamp.' : 'Charts could not load. The published lineup remains available below. Retry, or reload the page if a new snapshot was just published.';
    retry.hidden = false;
  }
}
document.querySelectorAll('[data-chart-scope]').forEach(button => button.addEventListener('click', () => { filtered = button.dataset.chartScope === 'filtered'; document.querySelectorAll('[data-chart-scope]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); render(); }));
document.addEventListener('lineup-filter-change', render);
retry.addEventListener('click', load);
refreshFreshness({ weekEnding: document.querySelector('#charts').dataset.weekEnding || null });
load();
setInterval(() => { if (menu) refreshFreshness(); }, 60000);

