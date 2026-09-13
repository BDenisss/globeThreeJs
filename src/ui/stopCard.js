export function createStopCard(root) {
  const el = document.createElement('section');
  el.className = 'card stop-card'; el.hidden = true;
  el.innerHTML = '<h2 class="card-name"></h2><p class="card-sub"></p><p class="card-dates"></p>';
  root.appendChild(el);
  let hideTimer = null;
  return {
    show({ name, sub, dates }) {
      clearTimeout(hideTimer);
      el.querySelector('.card-name').textContent = name;
      el.querySelector('.card-sub').textContent = sub || '';
      el.querySelector('.card-sub').hidden = !sub;
      el.querySelector('.card-dates').textContent = dates || '';
      el.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    },
    hide() {
      el.classList.remove('in');
      hideTimer = setTimeout(() => { el.hidden = true; }, 200);
    },
  };
}
