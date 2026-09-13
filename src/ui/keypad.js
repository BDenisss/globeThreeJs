export function createKeypad(root, { length, onSubmit, onClose }) {
  const el = document.createElement('div');
  el.className = 'keypad'; el.hidden = true; el.dataset.noSwipe = '';
  el.innerHTML = '<div class="keypad-slots"></div><p class="keypad-msg" aria-live="polite"></p><div class="keypad-grid"></div>';
  const slotsEl = el.querySelector('.keypad-slots');
  const slots = Array.from({ length }, () => { const s = document.createElement('span'); s.className = 'slot'; slotsEl.appendChild(s); return s; });
  const msg = el.querySelector('.keypad-msg');
  const grid = el.querySelector('.keypad-grid');
  let buf = '', busy = false, msgTimer = null, submitTimer = null;
  const draw = () => slots.forEach((s, i) => { s.textContent = buf[i] ?? ''; s.classList.toggle('filled', i < buf.length); });
  const press = (d) => {
    if (busy || buf.length >= length) return;
    buf += d; draw();
    if (buf.length === length) { busy = true; submitTimer = setTimeout(() => onSubmit(buf), 150); }
  };
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✕']) {
    const b = document.createElement('button');
    b.className = 'key'; b.textContent = k;
    if (k === '⌫') b.setAttribute('aria-label', 'Effacer');
    if (k === '✕') b.setAttribute('aria-label', 'Fermer');
    b.addEventListener('click', () => {
      if (k === '⌫') { if (!busy) { buf = buf.slice(0, -1); draw(); } }
      else if (k === '✕') onClose();
      else press(k);
    });
    grid.appendChild(b);
  }
  root.appendChild(el);
  const showMsg = (t) => { clearTimeout(msgTimer); msg.textContent = t; msgTimer = setTimeout(() => { msg.textContent = ''; }, 2000); };
  return {
    open() { buf = ''; busy = false; msg.textContent = ''; slots.forEach((s) => s.classList.remove('ok')); el.classList.remove('out'); draw(); el.hidden = false; },
    // Fermer annule toute saisie/soumission en attente : plus de callback surprise après coup.
    close() { clearTimeout(submitTimer); submitTimer = null; buf = ''; busy = false; draw(); el.hidden = true; },
    shake(message) {
      el.classList.add('shake'); showMsg(message);
      setTimeout(() => { el.classList.remove('shake'); buf = ''; busy = false; draw(); }, 400);
    },
    success() {
      slots.forEach((s) => s.classList.add('ok'));
      el.classList.add('out');
      setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, 400);
    },
  };
}
