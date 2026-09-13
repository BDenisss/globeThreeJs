export function createTicket(root, { onFlip }) {
  const wrap = document.createElement('div');
  wrap.className = 'ticket-wrap'; wrap.hidden = true; wrap.dataset.noSwipe = '';
  wrap.innerHTML = `
    <div class="ticket" role="button" tabindex="0" aria-label="Retourner le billet">
      <div class="ticket-face ticket-front">
        <div class="t-band">EUROSTAR · BOARDING PASS</div>
        <div class="t-route"><span class="t-from"></span><span class="t-arrow">→</span><span class="t-to"></span></div>
        <div class="t-dest"></div>
        <div class="t-dates"></div>
        <div class="t-pax"></div>
        <div class="t-stub"><span>SURPRISE</span></div>
      </div>
      <div class="ticket-face ticket-back">
        <div class="t-msg"></div>
        <div class="t-sign">Mimi</div>
      </div>
    </div>
    <p class="ticket-hint">touche le billet</p>`;
  const ticket = wrap.querySelector('.ticket');
  const hint = wrap.querySelector('.ticket-hint');
  ticket.addEventListener('click', onFlip);
  ticket.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); } });
  root.appendChild(wrap);
  let hintDone = false;
  const set = (sel, v) => { wrap.querySelector(sel).textContent = v ?? ''; };
  return {
    show(secret, flipped) {
      set('.t-from', secret.from); set('.t-to', secret.to); set('.t-dest', secret.destination);
      set('.t-dates', secret.dates); set('.t-pax', secret.passengers); set('.t-msg', secret.message);
      hint.hidden = hintDone;
      wrap.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('in')));
      this.setFlipped(flipped);
    },
    hide() { wrap.classList.remove('in'); setTimeout(() => { wrap.hidden = true; }, 200); },
    setFlipped(f) { ticket.classList.toggle('flipped', f); if (f) { hintDone = true; hint.hidden = true; } },
  };
}
