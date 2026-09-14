export function createIntro(root, { title, tagline, credits, onStart }) {
  const el = document.createElement('div');
  el.className = 'intro'; el.dataset.noSwipe = '';
  el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0');
  // DOM construit sans les valeurs (innerHTML), le texte est injecté ensuite via textContent (pas d'injection HTML).
  el.innerHTML = `
    <h1 class="intro-title"></h1>
    <div class="intro-progress"><div class="intro-bar"></div></div>
    <p class="intro-tagline" hidden></p>
    <p class="intro-credits"></p>`;
  el.querySelector('.intro-title').textContent = title;
  const bar = el.querySelector('.intro-bar'), prog = el.querySelector('.intro-progress'), tag = el.querySelector('.intro-tagline');
  tag.textContent = tagline;
  el.querySelector('.intro-credits').textContent = credits;
  let ready = false;
  const start = () => { if (ready) onStart(); };
  el.addEventListener('click', start);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); start(); } });
  root.appendChild(el);
  return {
    setProgress(p) { bar.style.width = `${Math.round(p * 100)}%`; },
    setReady() { ready = true; prog.hidden = true; tag.hidden = false; },
    // Échec de chargement : message d'erreur fixe à la place de la barre de progression, pas de pulsation, jamais « prêt ».
    setError(msg) { prog.hidden = true; tag.textContent = msg; tag.classList.add('intro-error'); tag.hidden = false; },
    hide() { el.classList.add('out'); setTimeout(() => el.remove(), 600); },
  };
}
