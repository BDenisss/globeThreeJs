import { SEAL } from './icons.js';

export function createLockCard(root, { onOpen }) {
  const el = document.createElement('section');
  el.className = 'card lock-card'; el.hidden = true;
  el.innerHTML = `<div class="seal">${SEAL}</div><h2 class="card-name">Destination mystère</h2><p class="lock-hint"></p><button class="btn-or">Entrer le code</button>`;
  el.querySelector('button').addEventListener('click', onOpen);
  root.appendChild(el);
  let hideTimer = null;
  return {
    show({ hint }) {
      clearTimeout(hideTimer);
      el.querySelector('.lock-hint').textContent = hint;
      el.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    },
    hide() { el.classList.remove('in'); hideTimer = setTimeout(() => { el.hidden = true; }, 200); },
  };
}
