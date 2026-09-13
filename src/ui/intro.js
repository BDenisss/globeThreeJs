export function createIntro(root, { title, tagline, credits, onStart }) {
  const el = document.createElement('div');
  el.className = 'intro'; el.dataset.noSwipe = '';
  el.innerHTML = `
    <h1 class="intro-title">${title}</h1>
    <div class="intro-progress"><div class="intro-bar"></div></div>
    <p class="intro-tagline" hidden>${tagline}</p>
    <p class="intro-credits">${credits}</p>`;
  const bar = el.querySelector('.intro-bar'), prog = el.querySelector('.intro-progress'), tag = el.querySelector('.intro-tagline');
  let ready = false;
  el.addEventListener('click', () => { if (ready) onStart(); });
  root.appendChild(el);
  return {
    setProgress(p) { bar.style.width = `${Math.round(p * 100)}%`; },
    setReady() { ready = true; prog.hidden = true; tag.hidden = false; },
    hide() { el.classList.add('out'); setTimeout(() => el.remove(), 600); },
  };
}
