import { freshness } from './freshness.js';
const bar = document.querySelector('.menu-status');
function update() {
  const state = freshness(bar.dataset.weekEnding || null);
  bar.classList.toggle('status-warning', state.warning);
  bar.querySelector('strong').textContent = state.label;
  let explanation = bar.querySelector('.status-explanation');
  if (!explanation) { explanation = document.createElement('p'); explanation.className = 'status-explanation'; bar.append(explanation); }
  explanation.textContent = state.explanation;
}
update();
setInterval(update, 60000);
