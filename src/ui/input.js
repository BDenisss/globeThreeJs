import { canNext, canPrev } from '../state.js';

export function classifySwipe(dx, dy, dt, { minDist = 40, maxTime = 300 } = {}) {
  if (dt > maxTime || Math.abs(dx) < minDist || Math.abs(dy) > Math.abs(dx)) return null;
  return dx < 0 ? 'next' : 'prev';
}

export function bindInput(el, { onNext, onPrev }) {
  let start = null;
  el.addEventListener('pointerdown', (e) => {
    start = e.target.closest('[data-no-swipe]') ? null : { x: e.clientX, y: e.clientY, t: performance.now() };
  });
  el.addEventListener('pointerup', (e) => {
    if (!start) return;
    const s = classifySwipe(e.clientX - start.x, e.clientY - start.y, performance.now() - start.t);
    start = null;
    if (s === 'next') onNext(); else if (s === 'prev') onPrev();
  });
  el.addEventListener('pointercancel', () => { start = null; });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') onNext();
    else if (e.key === 'ArrowLeft') onPrev();
  });
}

export function createChevrons(root, { onNext, onPrev }) {
  const mk = (cls, label, txt, fn) => {
    const b = document.createElement('button');
    b.className = `chevron ${cls}`; b.setAttribute('aria-label', label); b.textContent = txt;
    b.addEventListener('click', fn);
    root.appendChild(b);
    return b;
  };
  const prev = mk('chevron-prev', 'Étape précédente', '‹', onPrev);
  const next = mk('chevron-next', 'Étape suivante', '›', onNext);
  return {
    render(state) { prev.hidden = !canPrev(state); next.hidden = !canNext(state); },
  };
}
