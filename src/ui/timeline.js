import { ICONS } from './icons.js';
import { canGoto, FINAL, WAIT } from '../state.js';

export function createTimeline(root, stops, { onSelect }) {
  const el = document.createElement('nav');
  el.className = 'timeline'; el.setAttribute('aria-label', 'Étapes du voyage');
  const ids = [...stops.map((s) => s.id), 'final'];
  const dots = ids.map((id, i) => {
    const b = document.createElement('button');
    b.className = 'dot'; b.innerHTML = ICONS[id];
    b.setAttribute('aria-label', i === FINAL ? 'Destination mystère' : stops[i].name);
    b.addEventListener('click', () => onSelect(i));
    el.appendChild(b);
    return b;
  });
  root.appendChild(el);
  return {
    render(state) {
      el.hidden = state.phase === 'INTRO';
      dots.forEach((b, i) => {
        const current = state.stop === i || (i === FINAL && state.stop === WAIT);
        const visited = state.visited.includes(i);
        b.classList.toggle('current', current);
        b.classList.toggle('visited', visited && !current);
        b.classList.toggle('future', !visited && !current);
        if (i === FINAL) b.innerHTML = state.unlocked ? ICONS.final : ICONS.lock;
        b.disabled = !current && !canGoto(state, i);
      });
    },
  };
}
