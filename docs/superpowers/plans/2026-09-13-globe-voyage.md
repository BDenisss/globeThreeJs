# Le voyage de Nano — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un site statique three.js où un avion vole d'étape en étape sur un globe cartoon, avec une 8e étape verrouillée par un code chiffré qui révèle un billet Eurostar pour Londres.

**Architecture:** Vite + JS vanilla. `src/state.js` (réducteur pur) et `src/lib/*` (géo, easing, crypto) ne touchent ni three.js ni le DOM et sont testés avec vitest. `src/scene/*` (globe, route, avion, caméra, effets) et `src/ui/*` (intro, cartes, timeline, pavé, billet) lisent l'état et se mettent à jour ; `src/app/*` (store, runner de vol, séquence de déverrouillage) orchestre ; `src/main.js` câble le tout.

**Tech Stack:** Node 25 / npm 11 (local), three 0.186.0, vite 8.3.0, vitest 5.0.0, Vercel (import du repo GitHub, build automatique à chaque push).

**Spec:** `docs/superpowers/specs/2026-09-13-globe-voyage-design.md`

## Global Constraints

- Repo : `C:\Users\bucsp\Documents\kdodenano\site` (clone de https://github.com/BDenisss/globeThreeJs, branche `main`). Tous les chemins ci-dessous sont relatifs à cette racine.
- **Ne jamais pousser (`git push`) sans que Denis le demande** ; commits locaux à chaque tâche.
- Vite `base: '/'` (Vercel sert à la racine) ; URL finale `https://nano-adventure.vercel.app/`. Tous les fetchs d'assets passent par `import.meta.env.BASE_URL`.
- Palette : noir `#141414`, or `#D9B65C`, crème `#F3EBD8`, fond de scène `#0B1026`. Polices : Anton (titres), Libre Baskerville (texte), via Google Fonts avec fallbacks `Impact, sans-serif` / `Georgia, serif`.
- Étapes (dans cet ordre, indices 0–6) : Paris, Malaisie, Bali, Japon, Shanghai, Retour à Paris, Barcelone ; étape finale = indice 7 ; point d'attente = `'wait'`.
- Le code en clair et le contenu de la révélation réel n'entrent **jamais** dans le repo : seul `public/secret.enc` (chiffré) est versionné ; aucun hash du code n'est publié (ruling tâche 4 : la vérification du code = succès du déchiffrement AES-GCM). Le secret de développement utilise le code `123456` et une destination factice (« QUELQUE PART »).
- Crédits obligatoires (CC BY) : « Globe : Jacobs Development · Avion : Poly by Google — CC BY ».
- Tests : `npm test` (vitest, environnement node) doit passer avant chaque commit.
- Vérification visuelle : serveur Vite via `.claude/launch.json` à la racine de `kdodenano` (nom `dev`, port 5173, lance `npm --prefix site run dev`), page `http://localhost:5173/`, émulation mobile 375 × 812 pour les captures.
- Commits : message en français, terminé par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `index.html`, `src/styles.css` | Page unique, canvas + calque UI, tokens CSS, responsive |
| `vite.config.js`, `vitest.config.js`, `package.json`, `.gitignore`, `.claude/launch.json` | Outillage |
| `vercel.json` | Preset Vite + cache long sur `/models/` |
| `src/content.js` | Données éditées par Denis (étapes, indice, longueur du code, crédits) |
| `src/lib/ease.js` | Easing, clamp, lerp |
| `src/lib/geo.js` | lat/lon ↔ vecteur, slerp, arc, durée de vol |
| `src/lib/crypto.js` | PBKDF2 + AES-GCM (navigateur + Node) |
| `src/lib/persist.js` | localStorage / sessionStorage |
| `src/state.js` | Réducteur pur + prédicats `canNext/canPrev/canGoto` |
| `src/app/store.js` | `createStore` : état courant, dispatch, abonnés |
| `src/app/flight.js` | Runner de vol (progression, easing, callbacks) |
| `src/app/unlock.js` | Séquence de révélation |
| `src/scene/globeFit.js` | Recentrage/normalisation (pur) |
| `src/scene/globe.js` | Chargement glTF, hiérarchie root/calib/holder, `CALIB` |
| `src/scene/lights.js`, `src/scene/stars.js` | Éclairage, étoiles |
| `src/scene/debug.js` | Mode `?debug` : marqueurs, OrbitControls, réglage de `CALIB` |
| `src/scene/routeLogic.js` | Progression par segment (pur) |
| `src/scene/route.js` | Pointillés dorés (InstancedMesh) |
| `src/scene/planePose.js` | Pose de l'avion (pur) |
| `src/scene/plane.js` | Chargement/fallback procédural, application des poses |
| `src/scene/camera.js` | Rig caméra (distance, direction lissée, viewport) |
| `src/scene/effects.js` | « ? », éclat de particules, marqueur Big Ben |
| `src/ui/icons.js` | SVG des pictos |
| `src/ui/input.js` | Swipe, clavier, chevrons |
| `src/ui/intro.js` | Accueil + progression de chargement |
| `src/ui/stopCard.js` | Carte lieu/dates |
| `src/ui/lockCard.js` | Carte cachet + indice |
| `src/ui/keypad.js` | Pavé numérique |
| `src/ui/ticket.js` | Billet recto/verso |
| `src/ui/timeline.js` | 8 pastilles |
| `src/main.js` | Câblage |
| `scripts/sealLib.mjs`, `scripts/seal.mjs` | Scellement du secret |
| `test/*.test.js` | Tests vitest |
| `README.md` | Mode d'emploi pour Denis |

---

### Task 1 : Squelette Vite + déploiement (FAIT le 13/09 — hébergement basculé de GitHub Pages à Vercel après blocage Actions ; `base: '/'`, `vercel.json`, pas de workflow)

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `.gitignore`, `index.html`, `src/styles.css`, `src/main.js`, `.claude/launch.json`, `.github/workflows/pages.yml`, `test/smoke.test.js`

**Interfaces:**
- Produces: le script `npm run dev` (port 5173, base `/`), `npm run build` (→ `dist/`), `npm test` ; le canvas `#scene` et le conteneur `#ui` dans `index.html`.

- [ ] **Step 1 : Initialiser npm et installer les dépendances**

```bash
cd "C:/Users/bucsp/Documents/kdodenano/site"
npm init -y >/dev/null
npm install three@0.186.0
npm install -D vite@8.3.0 vitest@5.0.0
```

- [ ] **Step 2 : Écrire `package.json` (remplacer le contenu généré)**

```json
{
  "name": "globe-three-js",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "seal": "node scripts/seal.mjs"
  },
  "dependencies": {
    "three": "^0.186.0"
  },
  "devDependencies": {
    "vite": "^8.3.0",
    "vitest": "^5.0.0"
  }
}
```

- [ ] **Step 3 : Configs et gitignore**

`vite.config.js` :
```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: { port: 5173, strictPort: true },
});
```

`vitest.config.js` :
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['test/**/*.test.js'] },
});
```

`.gitignore` :
```
node_modules
dist
.vite
```

`.claude/launch.json` :
```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 }
  ]
}
```

- [ ] **Step 4 : `index.html`, `src/styles.css`, `src/main.js` minimal (cube qui tourne)**

`index.html` :
```html
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <meta name="theme-color" content="#0B1026" />
  <title>Le voyage de Nano</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/src/styles.css" />
</head>
<body>
  <canvas id="scene"></canvas>
  <div id="ui"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

`src/styles.css` :
```css
:root {
  --noir: #141414;
  --or: #D9B65C;
  --creme: #F3EBD8;
  --nuit: #0B1026;
  --titre: 'Anton', Impact, 'Arial Narrow', sans-serif;
  --texte: 'Libre Baskerville', Georgia, serif;
}
* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--nuit); color: var(--creme); font-family: var(--texte); overflow: hidden; -webkit-tap-highlight-color: transparent; }
#scene { position: fixed; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
#ui { position: fixed; inset: 0; pointer-events: none; }
#ui > * { pointer-events: auto; }
```

`src/main.js` :
```js
import * as THREE from 'three';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1026);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.z = 3;
const cube = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
scene.add(cube);

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop((t) => {
  cube.rotation.y = t / 1000;
  renderer.render(scene, camera);
});
```

- [ ] **Step 5 : Test de fumée**

`test/smoke.test.js` :
```js
import { describe, it, expect } from 'vitest';

describe('outillage', () => {
  it('vitest tourne', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run : `npm test` — Expected : `1 passed`.

- [ ] **Step 6 : Workflow GitHub Pages**

`.github/workflows/pages.yml` :
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7 : Vérifier build et dev**

Run : `npm run build` — Expected : `dist/index.html` existe et contient `/assets/`.
Puis démarrer le serveur via l'outil de preview (`preview_start` avec `name: "dev"`), naviguer vers `http://localhost:5173/`, capture : un cube coloré tourne sur fond bleu nuit.

- [ ] **Step 8 : Commit**

```bash
git add -A
git commit -m "Squelette Vite + three.js, workflow GitHub Pages

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2 : `lib/ease.js` et `lib/geo.js`

**Files:**
- Create: `src/lib/ease.js`, `src/lib/geo.js`, `test/geo.test.js`

**Interfaces:**
- Produces: `clamp01(x)`, `lerp(a,b,t)`, `easeInOutCubic(t)`, `easeOutCubic(t)` ; `latLonToVec3(lat, lon, r=1) → {x,y,z}`, `toLatLon(v) → {lat, lon}` (degrés), `normalize/dot/add/sub/scale/length/angleBetween`, `slerp(a,b,t)` (vecteurs unitaires), `liftFor(angle)`, `arcPoint(a,b,t,lift,base=1)`, `flightDuration(angle, backwards=false)` (secondes).

- [ ] **Step 1 : Écrire les tests**

`test/geo.test.js` :
```js
import { describe, it, expect } from 'vitest';
import {
  latLonToVec3, toLatLon, slerp, arcPoint, angleBetween, liftFor, flightDuration, length,
} from '../src/lib/geo.js';
import { easeInOutCubic, clamp01 } from '../src/lib/ease.js';

const PARIS = { lat: 48.8566, lon: 2.3522 };
const TOKYO = { lat: 35.6762, lon: 139.6503 };
const LONDON = { lat: 51.5074, lon: -0.1278 };
const KL = { lat: 3.139, lon: 101.6869 };
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

describe('latLonToVec3', () => {
  it('renvoie un vecteur unitaire', () => {
    expect(near(length(latLonToVec3(PARIS.lat, PARIS.lon)), 1)).toBe(true);
  });
  it('pôle Nord sur +Y, méridien 0 sur +Z, est sur +X', () => {
    const n = latLonToVec3(90, 0); expect(near(n.y, 1)).toBe(true);
    const z = latLonToVec3(0, 0); expect(near(z.z, 1)).toBe(true);
    const x = latLonToVec3(0, 90); expect(near(x.x, 1)).toBe(true);
  });
  it('Paris/Londres/KL ont les signes attendus', () => {
    const p = latLonToVec3(PARIS.lat, PARIS.lon);
    expect(p.y).toBeGreaterThan(0.7); expect(p.z).toBeGreaterThan(0); expect(p.x).toBeGreaterThan(0);
    expect(latLonToVec3(LONDON.lat, LONDON.lon).x).toBeLessThan(0);
    const k = latLonToVec3(KL.lat, KL.lon);
    expect(k.x).toBeGreaterThan(0.9); expect(Math.abs(k.y)).toBeLessThan(0.1);
  });
  it('toLatLon inverse latLonToVec3', () => {
    const ll = toLatLon(latLonToVec3(TOKYO.lat, TOKYO.lon));
    expect(near(ll.lat, TOKYO.lat, 1e-9)).toBe(true);
    expect(near(ll.lon, TOKYO.lon, 1e-9)).toBe(true);
  });
});

describe('slerp / arcPoint', () => {
  const a = latLonToVec3(PARIS.lat, PARIS.lon);
  const b = latLonToVec3(TOKYO.lat, TOKYO.lon);
  it('extrémités', () => {
    const s0 = slerp(a, b, 0), s1 = slerp(a, b, 1);
    expect(near(s0.x, a.x)).toBe(true); expect(near(s1.z, b.z)).toBe(true);
  });
  it('le milieu Paris → Tokyo passe au nord de 55°', () => {
    expect(toLatLon(slerp(a, b, 0.5)).lat).toBeGreaterThan(55);
  });
  it('arcPoint monte à base + lift au milieu et reste à base aux extrémités', () => {
    expect(near(length(arcPoint(a, b, 0.5, 0.2)), 1.2)).toBe(true);
    expect(near(length(arcPoint(a, b, 0, 0.2)), 1)).toBe(true);
    expect(near(length(arcPoint(a, b, 1, 0.2, 1.07)), 1.07)).toBe(true);
  });
  it('angleBetween Paris → Tokyo ≈ 1.52 rad', () => {
    expect(Math.abs(angleBetween(a, b) - 1.52)).toBeLessThan(0.02);
  });
});

describe('durées et altitude', () => {
  it('liftFor croît avec l angle et plafonne à 0.35', () => {
    expect(near(liftFor(0), 0.08)).toBe(true);
    expect(near(liftFor(Math.PI), 0.35)).toBe(true);
    expect(liftFor(Math.PI / 2)).toBeGreaterThan(0.2);
  });
  it('flightDuration : 1.2 s + 2.6 s·angle/π, ×0.6 en arrière', () => {
    expect(near(flightDuration(Math.PI / 2), 2.5)).toBe(true);
    expect(near(flightDuration(Math.PI / 2, true), 1.5)).toBe(true);
  });
  it('easeInOutCubic symétrique, clamp01 borne', () => {
    expect(near(easeInOutCubic(0.5), 0.5)).toBe(true);
    expect(easeInOutCubic(0)).toBe(0); expect(easeInOutCubic(1)).toBe(1);
    expect(clamp01(-2)).toBe(0); expect(clamp01(9)).toBe(1);
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, `Cannot find module '../src/lib/geo.js'`.

- [ ] **Step 3 : Implémenter**

`src/lib/ease.js` :
```js
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
```

`src/lib/geo.js` :
```js
// Repère géographique : Y = pôle Nord, +Z = méridien de Greenwich, +X = 90° Est.
export const DEG = Math.PI / 180;

export function latLonToVec3(lat, lon, r = 1) {
  const la = lat * DEG, lo = lon * DEG;
  return { x: r * Math.cos(la) * Math.sin(lo), y: r * Math.sin(la), z: r * Math.cos(la) * Math.cos(lo) };
}
export function toLatLon(v) {
  const u = normalize(v);
  return { lat: Math.asin(u.y) / DEG, lon: Math.atan2(u.x, u.z) / DEG };
}
export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (v) => Math.sqrt(dot(v, v));
export const scale = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export function normalize(v) {
  const l = length(v);
  return l === 0 ? { x: 0, y: 0, z: 0 } : scale(v, 1 / l);
}
export function angleBetween(a, b) {
  return Math.acos(Math.min(1, Math.max(-1, dot(normalize(a), normalize(b)))));
}
// Interpolation sphérique entre deux directions (arc de grand cercle).
export function slerp(a, b, t) {
  const ua = normalize(a), ub = normalize(b);
  const om = angleBetween(ua, ub);
  const so = Math.sin(om);
  if (so < 1e-6) return normalize(add(scale(ua, 1 - t), scale(ub, t)));
  return add(scale(ua, Math.sin((1 - t) * om) / so), scale(ub, Math.sin(t * om) / so));
}
// Bombement de l'arc selon sa longueur (rad), plafonné.
export const liftFor = (angle) => Math.min(0.35, 0.08 + 0.3 * angle / Math.PI);
// Point de l'arc à t ∈ [0,1], altitude base + lift·sin(πt).
export function arcPoint(a, b, t, lift, base = 1) {
  return scale(slerp(a, b, t), base + lift * Math.sin(Math.PI * t));
}
export function flightDuration(angle, backwards = false) {
  return (1.2 + 2.6 * angle / Math.PI) * (backwards ? 0.6 : 1);
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : tous PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/ease.js src/lib/geo.js test/geo.test.js
git commit -m "lib : easing et géométrie sphérique (lat/lon, slerp, arcs, durées de vol)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3 : Machine à états `state.js` + `app/store.js`

**Files:**
- Create: `src/state.js`, `src/app/store.js`, `test/state.test.js`

**Interfaces:**
- Produces: constantes `WAIT = 'wait'`, `FINAL = 7`, `LAST_REAL = 6` ; `initialState({unlocked, secretReady})` ; `reduce(state, action)` ; prédicats `canNext(s)`, `canPrev(s)`, `canGoto(s, j)` ; `createStore(initial, reducer) → { get(), dispatch(action), subscribe(fn) }` où `fn(state, prev, action)`.
- Forme de l'état : `{ phase: 'INTRO'|'AT_STOP'|'FLYING'|'LOCKED'|'UNLOCKING'|'REVEALED', stop: number|'wait', visited: number[], unlocked, secretReady, waitReached, flight: null|{from,to,backwards}, lockOpen, reentry, failures, ticketFlipped }`.
- Actions : `START, NEXT, PREV, GOTO{index}, ARRIVED, OPEN_LOCK, CLOSE_LOCK, CODE_OK, CODE_KO, LANDED, FLIP_TICKET, SECRET_READY`.

- [ ] **Step 1 : Écrire les tests**

`test/state.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { initialState, reduce, canNext, canPrev, canGoto, WAIT, FINAL } from '../src/state.js';
import { createStore } from '../src/app/store.js';

const run = (s, ...actions) => actions.reduce((st, a) => reduce(st, typeof a === 'string' ? { type: a } : a), s);
const NEXT = 'NEXT', PREV = 'PREV', ARRIVED = 'ARRIVED';

describe('parcours nominal', () => {
  it('INTRO → START → AT_STOP(0)', () => {
    const s = run(initialState(), 'START');
    expect(s.phase).toBe('AT_STOP'); expect(s.stop).toBe(0); expect(s.visited).toEqual([0]);
  });
  it('NEXT enchaîne les 7 étapes puis mène au point d attente (LOCKED)', () => {
    let s = run(initialState(), 'START');
    for (let i = 1; i <= 6; i++) {
      s = run(s, NEXT);
      expect(s.phase).toBe('FLYING'); expect(s.flight).toEqual({ from: i - 1, to: i, backwards: false });
      s = run(s, ARRIVED);
      expect(s.phase).toBe('AT_STOP'); expect(s.stop).toBe(i);
    }
    expect(s.visited).toEqual([0, 1, 2, 3, 4, 5, 6]);
    s = run(s, NEXT);
    expect(s.flight).toEqual({ from: 6, to: WAIT, backwards: false });
    s = run(s, ARRIVED);
    expect(s.phase).toBe('LOCKED'); expect(s.stop).toBe(WAIT); expect(s.waitReached).toBe(true); expect(s.reentry).toBe(false);
  });
  it('les commandes sont ignorées pendant un vol', () => {
    const s = run(initialState(), 'START', NEXT);
    expect(run(s, NEXT)).toBe(s); expect(run(s, PREV)).toBe(s); expect(run(s, { type: 'GOTO', index: 0 })).toBe(s);
  });
  it('PREV vole en arrière sur le même arc', () => {
    const s = run(initialState(), 'START', NEXT, ARRIVED, PREV);
    expect(s.flight).toEqual({ from: 1, to: 0, backwards: true });
    expect(run(s, ARRIVED).visited).toEqual([0, 1]);
  });
  it('PREV est ignoré à Paris, NEXT ignoré en INTRO', () => {
    const s0 = initialState();
    expect(run(s0, NEXT)).toBe(s0);
    const s = run(s0, 'START');
    expect(run(s, PREV)).toBe(s);
  });
});

describe('GOTO', () => {
  const atStop2 = run(initialState(), 'START', NEXT, ARRIVED, NEXT, ARRIVED);
  it('refuse une étape non visitée autre que la suivante', () => {
    expect(canGoto(atStop2, 5)).toBe(false);
    expect(run(atStop2, { type: 'GOTO', index: 5 })).toBe(atStop2);
  });
  it('accepte une étape visitée (en arrière) et la suivante (en avant)', () => {
    expect(run(atStop2, { type: 'GOTO', index: 0 }).flight).toEqual({ from: 2, to: 0, backwards: true });
    expect(run(atStop2, { type: 'GOTO', index: 3 }).flight).toEqual({ from: 2, to: 3, backwards: false });
  });
  it('GOTO(7) sans déverrouillage mène au point d attente seulement depuis Barcelone visitée', () => {
    expect(canGoto(atStop2, FINAL)).toBe(false);
    let s = atStop2; for (let i = 3; i <= 6; i++) s = run(s, NEXT, ARRIVED);
    expect(run(s, { type: 'GOTO', index: FINAL }).flight).toEqual({ from: 6, to: WAIT, backwards: false });
    const atWait = run(s, { type: 'GOTO', index: FINAL }, ARRIVED);
    expect(canGoto(atWait, FINAL)).toBe(false);   // déjà au point d attente
  });
});

describe('verrou et révélation', () => {
  let locked = run(initialState(), 'START');
  for (let i = 0; i < 7; i++) locked = run(locked, NEXT, ARRIVED);
  it('OPEN_LOCK / CLOSE_LOCK / CODE_KO', () => {
    let s = run(locked, 'OPEN_LOCK'); expect(s.lockOpen).toBe(true);
    s = run(s, 'CODE_KO'); expect(s.failures).toBe(1); expect(s.phase).toBe('LOCKED');
    s = run(s, 'CLOSE_LOCK'); expect(s.lockOpen).toBe(false);
  });
  it('les swipes sont ignorés tant que le pavé est ouvert', () => {
    const s = run(locked, 'OPEN_LOCK');
    expect(run(s, PREV)).toBe(s);
  });
  it('PREV depuis LOCKED ramène à Barcelone', () => {
    expect(run(locked, PREV).flight).toEqual({ from: WAIT, to: 6, backwards: true });
  });
  it('CODE_OK → UNLOCKING → LANDED → REVEALED, étape 7 visitée', () => {
    let s = run(locked, 'OPEN_LOCK', 'CODE_OK');
    expect(s.phase).toBe('UNLOCKING'); expect(s.unlocked).toBe(true); expect(s.secretReady).toBe(true); expect(s.lockOpen).toBe(false);
    s = run(s, 'LANDED');
    expect(s.phase).toBe('REVEALED'); expect(s.stop).toBe(FINAL); expect(s.visited).toContain(FINAL);
    expect(run(s, NEXT)).toBe(s);
    expect(run(s, 'FLIP_TICKET').ticketFlipped).toBe(true);
    expect(run(s, PREV).flight).toEqual({ from: FINAL, to: 6, backwards: true });
  });
  it('déjà déverrouillé + secret prêt : Barcelone → Londres direct → REVEALED', () => {
    let s = run(initialState({ unlocked: true, secretReady: true }), 'START');
    for (let i = 0; i < 6; i++) s = run(s, NEXT, ARRIVED);
    s = run(s, NEXT); expect(s.flight).toEqual({ from: 6, to: FINAL, backwards: false });
    s = run(s, ARRIVED); expect(s.phase).toBe('REVEALED'); expect(s.waitReached).toBe(false);
  });
  it('déjà déverrouillé sans secret : arrivée à Londres = LOCKED(reentry), CODE_OK → REVEALED sans vol', () => {
    let s = run(initialState({ unlocked: true, secretReady: false }), 'START');
    for (let i = 0; i < 7; i++) s = run(s, NEXT, ARRIVED);
    expect(s.phase).toBe('LOCKED'); expect(s.reentry).toBe(true); expect(s.stop).toBe(FINAL);
    s = run(s, 'OPEN_LOCK', 'CODE_OK');
    expect(s.phase).toBe('REVEALED'); expect(s.reentry).toBe(false);
  });
  it('SECRET_READY marque le secret disponible', () => {
    expect(run(initialState(), 'SECRET_READY').secretReady).toBe(true);
  });
});

describe('prédicats', () => {
  it('canNext / canPrev', () => {
    const s = run(initialState(), 'START');
    expect(canNext(s)).toBe(true); expect(canPrev(s)).toBe(false);
    const f = run(s, NEXT); expect(canNext(f)).toBe(false);
  });
});

describe('store', () => {
  it('dispatch notifie les abonnés seulement si l état change', () => {
    const store = createStore(initialState(), reduce);
    const calls = [];
    store.subscribe((s, prev, a) => calls.push([a.type, prev.phase, s.phase]));
    store.dispatch({ type: 'NEXT' });   // ignoré en INTRO
    store.dispatch({ type: 'START' });
    expect(calls).toEqual([['START', 'INTRO', 'AT_STOP']]);
    expect(store.get().phase).toBe('AT_STOP');
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, modules `state.js`/`store.js` introuvables.

- [ ] **Step 3 : Implémenter**

`src/state.js` :
```js
export const WAIT = 'wait';
export const FINAL = 7;
export const LAST_REAL = 6;

export function initialState({ unlocked = false, secretReady = false } = {}) {
  return {
    phase: 'INTRO', stop: 0, visited: [0], unlocked, secretReady, waitReached: false,
    flight: null, lockOpen: false, reentry: false, failures: 0, ticketFlipped: false,
  };
}

const atRest = (s) => s.phase === 'AT_STOP' || s.phase === 'LOCKED' || s.phase === 'REVEALED';
const maxVisited = (v) => Math.max(...v);

export function canNext(s) {
  return s.phase === 'AT_STOP' && s.stop <= LAST_REAL;
}
export function canPrev(s) {
  if (s.lockOpen) return false;
  if (s.phase === 'AT_STOP') return s.stop > 0;
  return s.phase === 'LOCKED' || s.phase === 'REVEALED';
}
export function canGoto(s, j) {
  if (!atRest(s) || s.lockOpen || j === s.stop) return false;
  if (j === FINAL) return s.stop !== WAIT && s.visited.includes(LAST_REAL);
  return s.visited.includes(j) || j === maxVisited(s.visited) + 1;
}

function fly(s, to, backwards) {
  return { ...s, phase: 'FLYING', flight: { from: s.stop, to, backwards }, lockOpen: false };
}

export function reduce(s, action) {
  switch (action.type) {
    case 'START':
      return s.phase === 'INTRO' ? { ...s, phase: 'AT_STOP' } : s;
    case 'SECRET_READY':
      return { ...s, secretReady: true };
    case 'NEXT': {
      if (!canNext(s)) return s;
      if (s.stop < LAST_REAL) return fly(s, s.stop + 1, false);
      return fly(s, s.unlocked ? FINAL : WAIT, false);
    }
    case 'PREV': {
      if (!canPrev(s)) return s;
      if (s.phase === 'AT_STOP') return fly(s, s.stop - 1, true);
      return fly(s, LAST_REAL, true);
    }
    case 'GOTO': {
      const j = action.index;
      if (!canGoto(s, j)) return s;
      if (j === FINAL) {
        const direct = s.unlocked || s.visited.includes(FINAL);
        return fly(s, direct ? FINAL : WAIT, false);
      }
      const backwards = typeof s.stop === 'number' ? j < s.stop : true;
      return fly(s, j, backwards);
    }
    case 'ARRIVED': {
      if (s.phase !== 'FLYING') return s;
      const to = s.flight.to;
      const base = { ...s, flight: null };
      if (to === WAIT) return { ...base, phase: 'LOCKED', stop: WAIT, waitReached: true, reentry: false };
      const visited = base.visited.includes(to) ? base.visited : [...base.visited, to].sort((a, b) => a - b);
      if (to === FINAL) {
        return s.secretReady
          ? { ...base, phase: 'REVEALED', stop: FINAL, visited }
          : { ...base, phase: 'LOCKED', stop: FINAL, visited, reentry: true };
      }
      return { ...base, phase: 'AT_STOP', stop: to, visited };
    }
    case 'OPEN_LOCK':
      return s.phase === 'LOCKED' ? { ...s, lockOpen: true } : s;
    case 'CLOSE_LOCK':
      return s.phase === 'LOCKED' ? { ...s, lockOpen: false } : s;
    case 'CODE_KO':
      return s.phase === 'LOCKED' ? { ...s, failures: s.failures + 1 } : s;
    case 'CODE_OK': {
      if (s.phase !== 'LOCKED') return s;
      const next = { ...s, unlocked: true, secretReady: true, lockOpen: false };
      if (s.reentry) return { ...next, phase: 'REVEALED', stop: FINAL, reentry: false };
      return { ...next, phase: 'UNLOCKING' };
    }
    case 'LANDED': {
      if (s.phase !== 'UNLOCKING') return s;
      const visited = s.visited.includes(FINAL) ? s.visited : [...s.visited, FINAL];
      return { ...s, phase: 'REVEALED', stop: FINAL, visited };
    }
    case 'FLIP_TICKET':
      return s.phase === 'REVEALED' ? { ...s, ticketFlipped: !s.ticketFlipped } : s;
    default:
      return s;
  }
}
```

`src/app/store.js` :
```js
export function createStore(initial, reducer) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    dispatch(action) {
      const prev = state;
      state = reducer(state, action);
      if (state !== prev) for (const fn of subs) fn(state, prev, action);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : tous PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/state.js src/app/store.js test/state.test.js
git commit -m "Machine à états du parcours (étapes, vol, verrou, révélation) + store

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4 : Chiffrement `lib/crypto.js`, `lib/persist.js`, script `seal`, `content.js`

**Files:**
- Create: `src/lib/crypto.js`, `src/lib/persist.js`, `src/content.js`, `scripts/sealLib.mjs`, `scripts/seal.mjs`, `test/crypto.test.js`, `public/secret.enc` (secret de dev)

**Interfaces:**
- Produces: `hashCode(code, saltHex) → Promise<hex>`, `encryptSecret(code, obj) → Promise<sealed>`, `decryptSecret(code, sealed) → Promise<obj>` (rejette si mauvais code), `randomBytes(n)`, `bytesToHex(b)` ; `seal(code, content) → Promise<{salt, hash, sealed}>`, `patchContent(source, salt, hash) → string` ; `persist.isUnlocked()`, `persist.setUnlocked()`, `persist.getSessionCode()`, `persist.setSessionCode(code)`, `persist.reset()` ; `content.js` exporte `title, stops, mystery, codeSalt, codeHash, credits`.
- Format `sealed` : `{ v: 1, kdfSalt: b64, iv: b64, ciphertext: b64 }`. Contenu clair : `{ destination, dates, from, to, passengers, message }`.

- [ ] **Step 1 : Écrire les tests**

`test/crypto.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { hashCode, encryptSecret, decryptSecret } from '../src/lib/crypto.js';
import { seal, patchContent } from '../scripts/sealLib.mjs';

const CONTENT = { destination: 'QUELQUE PART', dates: 'BIENTÔT', from: 'A', to: 'B', passengers: 'X & Y', message: 'Coucou\nligne 2' };

describe('crypto', () => {
  it('hashCode est déterministe et dépend du sel', async () => {
    const h1 = await hashCode('123456', 'aa');
    expect(h1).toBe(await hashCode('123456', 'aa'));
    expect(h1).toHaveLength(64);
    expect(h1).not.toBe(await hashCode('123456', 'bb'));
    expect(h1).not.toBe(await hashCode('123457', 'aa'));
  });
  it('encryptSecret / decryptSecret font l aller-retour', async () => {
    const sealed = await encryptSecret('123456', CONTENT);
    expect(sealed.v).toBe(1);
    expect(JSON.stringify(sealed)).not.toContain('QUELQUE');
    expect(await decryptSecret('123456', sealed)).toEqual(CONTENT);
  });
  it('un mauvais code est rejeté proprement', async () => {
    const sealed = await encryptSecret('123456', CONTENT);
    await expect(decryptSecret('000000', sealed)).rejects.toBeTruthy();
    await expect(decryptSecret('123456', { v: 2 })).rejects.toThrow(/format/);
  });
});

describe('seal', () => {
  it('produit sel, hash et secret vérifiés', async () => {
    const { salt, hash, sealed } = await seal('4242', CONTENT);
    expect(salt).toHaveLength(32);
    expect(hash).toBe(await hashCode('4242', salt));
    expect(await decryptSecret('4242', sealed)).toEqual(CONTENT);
  });
  it('patchContent remplace uniquement les deux lignes', () => {
    const src = 'export const a = 1;\nexport const codeSalt = "";\nexport const codeHash = "old";\n';
    const out = patchContent(src, 'S', 'H');
    expect(out).toBe('export const a = 1;\nexport const codeSalt = "S";\nexport const codeHash = "H";\n');
    expect(() => patchContent('rien', 'S', 'H')).toThrow(/codeSalt/);
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, modules introuvables.

- [ ] **Step 3 : Implémenter `src/lib/crypto.js`**

```js
// Fonctionne dans le navigateur et dans Node ≥ 20 (globalThis.crypto).
const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
const KDF_ITERATIONS = 200000;

export function randomBytes(n) {
  const b = new Uint8Array(n);
  globalThis.crypto.getRandomValues(b);
  return b;
}
export const bytesToHex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
export const bytesToB64 = (b) => btoa(String.fromCharCode(...b));
export const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function sha256Hex(text) {
  const d = await subtle.digest('SHA-256', enc.encode(text));
  return bytesToHex(new Uint8Array(d));
}
export const hashCode = (code, saltHex) => sha256Hex(saltHex + code);

async function deriveKey(code, saltBytes) {
  const base = await subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: KDF_ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}
export async function encryptSecret(code, obj) {
  const kdfSalt = randomBytes(16), iv = randomBytes(12);
  const key = await deriveKey(code, kdfSalt);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { v: 1, kdfSalt: bytesToB64(kdfSalt), iv: bytesToB64(iv), ciphertext: bytesToB64(new Uint8Array(ct)) };
}
export async function decryptSecret(code, sealed) {
  if (!sealed || sealed.v !== 1) throw new Error('format de secret inconnu');
  const key = await deriveKey(code, b64ToBytes(sealed.kdfSalt));
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(sealed.iv) }, key, b64ToBytes(sealed.ciphertext));
  return JSON.parse(dec.decode(pt));
}
```

- [ ] **Step 4 : Implémenter `scripts/sealLib.mjs` et `scripts/seal.mjs`**

`scripts/sealLib.mjs` :
```js
import { randomBytes, bytesToHex, hashCode, encryptSecret, decryptSecret } from '../src/lib/crypto.js';

export async function seal(code, content) {
  const salt = bytesToHex(randomBytes(16));
  const hash = await hashCode(code, salt);
  const sealed = await encryptSecret(code, content);
  const back = await decryptSecret(code, sealed);
  if (JSON.stringify(back) !== JSON.stringify(content)) throw new Error('vérification du déchiffrement échouée');
  return { salt, hash, sealed };
}

export function patchContent(source, salt, hash) {
  const rSalt = /export const codeSalt = "[^"]*";/;
  const rHash = /export const codeHash = "[^"]*";/;
  if (!rSalt.test(source) || !rHash.test(source)) throw new Error('content.js : lignes codeSalt/codeHash introuvables');
  return source.replace(rSalt, `export const codeSalt = "${salt}";`).replace(rHash, `export const codeHash = "${hash}";`);
}
```

`scripts/seal.mjs` :
```js
#!/usr/bin/env node
// Usage interactif : npm run seal
// Usage non interactif (dev) : node scripts/seal.mjs --code 123456 --file dev-secret.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout, argv } from 'node:process';
import { seal, patchContent } from './sealLib.mjs';

const CONTENT_PATH = new URL('../src/content.js', import.meta.url);
const SECRET_PATH = new URL('../public/secret.enc', import.meta.url);

function arg(name) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function askMasked(question) {
  return new Promise((resolve) => {
    stdout.write(question);
    let buf = '';
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
    const onData = (ch) => {
      if (ch === '\r' || ch === '\n') { stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData); stdout.write('\n'); resolve(buf); }
      else if (ch === '\u0003') { process.exit(1); }
      else if (ch === '\u007f' || ch === '\b') { buf = buf.slice(0, -1); }
      else { buf += ch; stdout.write('•'); }
    };
    stdin.on('data', onData);
  });
}

async function askAll() {
  const rl = createInterface({ input: stdin, output: stdout });
  const content = {};
  content.destination = await rl.question('Destination (ex. LONDRES) : ');
  content.dates = await rl.question('Dates (ex. 2 – 4 OCT 2026) : ');
  content.from = await rl.question('Gare de départ (ex. PARIS GARE DU NORD) : ');
  content.to = await rl.question('Gare d arrivée (ex. LONDON ST PANCRAS) : ');
  content.passengers = await rl.question('Passagers (ex. NANO & MIMI) : ');
  stdout.write('Message (verso du billet), termine par une ligne vide :\n');
  const lines = [];
  for (;;) { const l = await rl.question(''); if (l === '') break; lines.push(l); }
  content.message = lines.join('\n');
  rl.close();
  const code = await askMasked('Code secret (chiffres, masqué) : ');
  const again = await askMasked('Confirme le code : ');
  if (code !== again) { console.error('Les deux codes diffèrent.'); process.exit(1); }
  return { code, content };
}

const { code, content } = arg('code') && arg('file')
  ? { code: arg('code'), content: JSON.parse(readFileSync(arg('file'), 'utf8')) }
  : await askAll();

if (!/^\d{4,8}$/.test(code)) { console.error('Le code doit faire 4 à 8 chiffres.'); process.exit(1); }

const { salt, hash, sealed } = await seal(code, content);
writeFileSync(SECRET_PATH, JSON.stringify(sealed));
writeFileSync(CONTENT_PATH, patchContent(readFileSync(CONTENT_PATH, 'utf8'), salt, hash));
console.log(`OK — secret.enc écrit, content.js mis à jour (codeLength attendu : ${code.length}).`);
console.log(`Destination : ${content.destination} · ${content.dates}`);
```

- [ ] **Step 5 : Implémenter `src/lib/persist.js` et `src/content.js`**

`src/lib/persist.js` :
```js
const LS_UNLOCKED = 'nano.unlocked';
const SS_CODE = 'nano.code';
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

export const persist = {
  isUnlocked: () => safe(() => localStorage.getItem(LS_UNLOCKED) === '1', false),
  setUnlocked: () => safe(() => localStorage.setItem(LS_UNLOCKED, '1')),
  getSessionCode: () => safe(() => sessionStorage.getItem(SS_CODE), null),
  setSessionCode: (code) => safe(() => sessionStorage.setItem(SS_CODE, code)),
  reset: () => safe(() => { localStorage.removeItem(LS_UNLOCKED); sessionStorage.removeItem(SS_CODE); }),
};
```

`src/content.js` :
```js
// ✏️ Seul fichier à éditer pour le contenu. Les coordonnées servent à placer les étapes sur le globe.
export const title = "Le voyage de Nano";
export const tagline = "Touche pour décoller";

export const stops = [
  { id: "paris",     name: "Paris",          sub: "Où tout a commencé",      dates: "Mars 2026",          lat: 48.8566, lon:   2.3522 },
  { id: "malaisie",  name: "Malaisie",       sub: "Kuala Lumpur · Langkawi", dates: "Mai – juillet 2026", lat:  3.1390, lon: 101.6869 },
  { id: "bali",      name: "Bali",           sub: "",                        dates: "2026",               lat: -8.6500, lon: 115.2167 },
  { id: "japon",     name: "Japon",          sub: "",                        dates: "2026",               lat: 35.6762, lon: 139.6503 },
  { id: "shanghai",  name: "Shanghai",       sub: "",                        dates: "2026",               lat: 31.2304, lon: 121.4737 },
  { id: "retour",    name: "Retour à Paris", sub: "",                        dates: "Juillet 2026",       lat: 48.8566, lon:   2.3522 },
  { id: "barcelone", name: "Barcelone",      sub: "",                        dates: "2026",               lat: 41.3874, lon:   2.1686 },
];

export const mystery = {
  hint: "Ton indice écrit ici.",
  reentryHint: "Entre à nouveau le code pour revoir ton billet.",
  codeLength: 6,
  waitPoint: { lat: 45, lon: -12 },
  destination: { lat: 51.5074, lon: -0.1278 },
};

// Remplis par `npm run seal` — ne pas éditer à la main.
export const codeSalt = "";
export const codeHash = "";

export const credits = "Globe : Jacobs Development · Avion : Poly by Google — CC BY";
```

- [ ] **Step 6 : Lancer les tests**

Run : `npm test` — Expected : tous PASS.

- [ ] **Step 7 : Générer le secret de développement**

Créer `dev-secret.json` **dans le scratchpad** (pas dans le repo) :
```json
{ "destination": "QUELQUE PART", "dates": "BIENTÔT", "from": "GARE DE DÉPART", "to": "GARE D'ARRIVÉE", "passengers": "NANO & MIMI", "message": "Message de test — Denis le remplace avec `npm run seal`." }
```
Run : `node scripts/seal.mjs --code 123456 --file "<scratchpad>/dev-secret.json"`
Expected : `OK — secret.enc écrit…` ; `public/secret.enc` existe ; `src/content.js` a un `codeSalt` de 32 hex et un `codeHash` de 64 hex.

- [ ] **Step 8 : Commit**

```bash
git add src/lib/crypto.js src/lib/persist.js src/content.js scripts/ test/crypto.test.js public/secret.enc
git commit -m "Chiffrement du secret (SHA-256 + PBKDF2/AES-GCM), script seal, content.js

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5 : Globe — chargement, recentrage, normalisation, lumières, étoiles

**Files:**
- Create: `src/scene/globeFit.js`, `src/scene/globe.js`, `src/scene/lights.js`, `src/scene/stars.js`, `test/globeFit.test.js`
- Modify: `src/main.js` (remplacer le cube par le globe)

**Interfaces:**
- Produces: `fitSphere(positions: number[]) → { center:{x,y,z}, seaRadius, maxRadius }` (pur) ; `loadGlobe(url, onProgress) → Promise<globe>` avec `globe = { root: THREE.Group, calib: THREE.Group, reliefRadius: number, setCalibration({yaw,pitch,roll}) }` ; `CALIB` (constante exportée, radians) ; `addLights(scene)` ; `createStars(count, radius) → THREE.Points`.
- Convention : tout ce qui est « géographique » (route, marqueurs, avion) est ajouté à `globe.root` en coordonnées `latLonToVec3` ; le modèle vit sous `globe.calib` (rotation de correction).

- [ ] **Step 1 : Test de `fitSphere`**

`test/globeFit.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { fitSphere, percentile } from '../src/scene/globeFit.js';

function spherePoints(n, r, c, seed = 1) {
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, k = Math.sqrt(1 - u * u);
    out.push(c.x + r * k * Math.cos(th), c.y + r * k * Math.sin(th), c.z + r * u);
  }
  return out;
}

describe('fitSphere', () => {
  it('percentile', () => {
    expect(percentile([5, 1, 3], 0)).toBe(1);
    expect(percentile([5, 1, 3], 1)).toBe(5);
    expect(percentile([5, 1, 3], 0.5)).toBe(3);
  });
  it('retrouve le centre et le rayon de la mer malgré des continents extrudés d un seul côté', () => {
    const c = { x: 1, y: 2, z: 3 };
    const sea = spherePoints(3000, 3, c);
    // « continents » : 600 points à r = 3.15, tous dans l hémisphère +x
    const land = spherePoints(600, 3.15, c, 7).map((v, i) => (i % 3 === 0 ? Math.abs(v - c.x) + c.x : v));
    const { center, seaRadius, maxRadius } = fitSphere([...sea, ...land]);
    expect(Math.abs(center.x - 1)).toBeLessThan(0.02);
    expect(Math.abs(center.y - 2)).toBeLessThan(0.02);
    expect(Math.abs(center.z - 3)).toBeLessThan(0.02);
    expect(Math.abs(seaRadius - 3)).toBeLessThan(0.02);
    expect(maxRadius).toBeGreaterThan(3.1);
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, `globeFit.js` introuvable.

- [ ] **Step 3 : Implémenter `src/scene/globeFit.js`**

```js
// Estime le centre et le rayon « niveau de la mer » d'un globe low-poly dont les continents sont extrudés.
export function percentile(values, p) {
  const s = [...values].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))));
  return s[i];
}

function distances(positions, c) {
  const out = new Array(positions.length / 3);
  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - c.x, dy = positions[i + 1] - c.y, dz = positions[i + 2] - c.z;
    out[i / 3] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return out;
}

// Résout A·x = b (4×4) par élimination de Gauss avec pivot partiel.
function solve4(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 4; r++) {
      if (r === c || M[c][c] === 0) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[4] / row[i]);
}

// Ajustement algébrique de sphère (Kåsa) : x²+y²+z² = 2ax + 2by + 2cz + k, moindres carrés.
// Insensible à la répartition des points tant qu'ils sont sur la sphère (pas de biais d'hémisphère).
export function kasaFit(positions, indices = null) {
  const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], b = [0, 0, 0, 0];
  const n = indices ? indices.length : positions.length / 3;
  for (let j = 0; j < n; j++) {
    const i = indices ? indices[j] : j;
    const x = positions[3 * i], y = positions[3 * i + 1], z = positions[3 * i + 2];
    const row = [2 * x, 2 * y, 2 * z, 1], rhs = x * x + y * y + z * z;
    for (let r = 0; r < 4; r++) { for (let c = 0; c < 4; c++) A[r][c] += row[r] * row[c]; b[r] += row[r] * rhs; }
  }
  const [a, bb, c, k] = solve4(A, b);
  return { center: { x: a, y: bb, z: c }, radius: Math.sqrt(Math.max(0, k + a * a + bb * bb + c * c)) };
}

export function fitSphere(positions) {
  // Passe 1 : sphère sur tous les sommets (légèrement biaisée par les continents extrudés).
  let { center } = kasaFit(positions);
  // Passes 2-4 : on ne garde que la bande « mer » (5e percentile × 1,03) et on réajuste.
  for (let iter = 0; iter < 3; iter++) {
    const d = distances(positions, center);
    const sea = percentile(d, 0.05);
    const keep = [];
    for (let i = 0; i < d.length; i++) if (d[i] <= sea * 1.03) keep.push(i);
    if (keep.length < 10) break;
    center = kasaFit(positions, keep).center;
  }
  const d = distances(positions, center);
  return { center, seaRadius: percentile(d, 0.05), maxRadius: percentile(d, 1) };
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : PASS.

- [ ] **Step 5 : Implémenter `globe.js`, `lights.js`, `stars.js`**

`src/scene/globe.js` :
```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fitSphere } from './globeFit.js';

// Rotation de correction du modèle (radians), réglée une fois en mode ?debug (Task 6).
export const CALIB = { yaw: 0, pitch: 0, roll: 0 };

export function loadGlobe(url, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => resolve(buildGlobe(gltf.scene)),
      (ev) => { if (ev.total) onProgress(ev.loaded / ev.total); },
      reject,
    );
  });
}

export function collectWorldPositions(object) {
  object.updateMatrixWorld(true);
  const out = [];
  const v = new THREE.Vector3();
  object.traverse((o) => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      out.push(v.x, v.y, v.z);
    }
  });
  return out;
}

export function buildGlobe(model) {
  const { center, seaRadius, maxRadius } = fitSphere(collectWorldPositions(model));
  const holder = new THREE.Group();            // recentre + normalise (rayon mer = 1)
  model.position.set(-center.x, -center.y, -center.z);
  holder.add(model);
  holder.scale.setScalar(1 / seaRadius);
  const calib = new THREE.Group();             // orientation corrigée
  calib.rotation.order = 'YXZ';
  calib.rotation.set(CALIB.pitch, CALIB.yaw, CALIB.roll);
  calib.add(holder);
  const root = new THREE.Group();              // repère géographique
  root.add(calib);
  model.traverse((o) => {
    if (o.isMesh && o.material) { o.material.roughness = 0.95; o.material.metalness = 0; }
  });
  return {
    root, calib,
    reliefRadius: maxRadius / seaRadius,
    setCalibration({ yaw, pitch, roll }) { calib.rotation.set(pitch, yaw, roll); },
  };
}
```

`src/scene/lights.js` :
```js
import * as THREE from 'three';

export function addLights(scene) {
  scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x2b1d12, 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.position.set(-2, 3, 2);
  scene.add(sun);
  const gold = new THREE.DirectionalLight(0xd9b65c, 0.5);
  gold.position.set(2, -1.5, -2);
  scene.add(gold);
}
```

`src/scene/stars.js` :
```js
import * as THREE from 'three';

export function createStars(count = 400, radius = 40) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, k = Math.sqrt(1 - u * u);
    pos[3 * i] = radius * k * Math.cos(th); pos[3 * i + 1] = radius * u; pos[3 * i + 2] = radius * k * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, transparent: true, opacity: 0.6 });
  return new THREE.Points(geo, mat);
}
```

- [ ] **Step 6 : Remplacer `src/main.js`**

```js
import * as THREE from 'three';
import { loadGlobe } from './scene/globe.js';
import { addLights } from './scene/lights.js';
import { createStars } from './scene/stars.js';

const BASE = import.meta.env.BASE_URL;
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1026);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0.6, 3.4);
camera.lookAt(0, 0, 0);
addLights(scene);
scene.add(createStars());

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const globe = await loadGlobe(`${BASE}models/earth.glb`, (p) => console.log('globe', Math.round(p * 100) + '%'));
scene.add(globe.root);
console.log('relief max', globe.reliefRadius.toFixed(3));

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  globe.root.rotation.y += 0.05 * dt;
  renderer.render(scene, camera);
});
```

- [ ] **Step 7 : Vérification visuelle**

Serveur `dev` démarré, ouvrir `http://localhost:5173/`, attendre 3 s, capture. Expected : globe cartoon centré, entier, tournant lentement, éclairé (continents verts/bruns lisibles, océan bleu), étoiles discrètes ; console : `relief max 1.0xx` (entre 1.02 et 1.12). Si le globe est décentré ou coupé : `fitSphere` a échoué → vérifier `collectWorldPositions` (il faut `updateMatrixWorld(true)` avant lecture).

- [ ] **Step 8 : Commit**

```bash
git add src/scene/globeFit.js src/scene/globe.js src/scene/lights.js src/scene/stars.js src/main.js test/globeFit.test.js
git commit -m "Globe : chargement glTF, recentrage/normalisation, lumières, étoiles

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6 : Mode `?debug` et calibration de `CALIB`

**Files:**
- Create: `src/scene/debug.js`
- Modify: `src/main.js` (activer le debug), `src/scene/globe.js` (valeurs finales de `CALIB`)

**Interfaces:**
- Produces: `setupDebug({ globe, camera, renderer, points }) → { update(dt) }` ; expose `window.__calib(yawDeg, pitchDeg, rollDeg)` et `window.__calibGet()` ; `isDebug()`.
- Consumes: `latLonToVec3` (Task 2), `globe.root/setCalibration` (Task 5), `stops`/`mystery` (Task 4).

- [ ] **Step 1 : Implémenter `src/scene/debug.js`**

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { latLonToVec3, DEG } from '../lib/geo.js';
import { CALIB } from './globe.js';

export const isDebug = () => new URLSearchParams(location.search).has('debug');

// points : [{ name, lat, lon }] — un marqueur rouge par point, à l'altitude 1.08.
export function setupDebug({ globe, camera, renderer, points }) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  const geo = new THREE.SphereGeometry(0.018, 12, 12);
  for (const p of points) {
    const m = new THREE.Mesh(geo, mat);
    const v = latLonToVec3(p.lat, p.lon, 1.08);
    m.position.set(v.x, v.y, v.z);
    m.name = `dbg:${p.name}`;
    globe.root.add(m);
  }
  const axes = new THREE.AxesHelper(1.6);   // X rouge = 90°E, Y vert = Nord, Z bleu = Greenwich
  globe.root.add(axes);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const c = { yaw: CALIB.yaw / DEG, pitch: CALIB.pitch / DEG, roll: CALIB.roll / DEG };
  const apply = () => globe.setCalibration({ yaw: c.yaw * DEG, pitch: c.pitch * DEG, roll: c.roll * DEG });
  window.__calib = (yaw, pitch, roll) => { c.yaw = yaw; c.pitch = pitch; c.roll = roll; apply(); return { ...c }; };
  window.__calibGet = () => ({ ...c });
  window.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 5 : 1;
    switch (e.key.toLowerCase()) {
      case 'q': c.yaw -= step; break;   case 'e': c.yaw += step; break;
      case 'w': c.pitch -= step; break; case 's': c.pitch += step; break;
      case 'a': c.roll -= step; break;  case 'd': c.roll += step; break;
      case 'p': console.log('CALIB (deg)', JSON.stringify(c)); return;
      default: return;
    }
    apply();
  });
  console.log('debug : Q/E yaw, W/S pitch, A/D roll (Shift = 5°), P = afficher ; window.__calib(y,p,r)');
  return { update() { controls.update(); } };
}
```

- [ ] **Step 2 : Brancher dans `src/main.js`**

Ajouter les imports :
```js
import { setupDebug, isDebug } from './scene/debug.js';
import { stops, mystery } from './content.js';
```
Après `scene.add(globe.root);` :
```js
const debug = isDebug()
  ? setupDebug({ globe, camera, renderer, points: [...stops, { name: 'londres', ...mystery.destination }, { name: 'wait', ...mystery.waitPoint }] })
  : null;
```
Dans la boucle, remplacer `globe.root.rotation.y += 0.05 * dt;` par :
```js
if (debug) debug.update(dt); else globe.root.rotation.y += 0.05 * dt;
```

- [ ] **Step 3 : Calibrer**

Ouvrir `http://localhost:5173/?debug`. Le globe est immobile, les marqueurs rouges sont aux positions géographiques du **repère**, pas du modèle : il faut tourner le modèle (`__calib`) jusqu'à ce que chaque marqueur touche la bonne ville. Méthode :
1. Capture. Repérer l'Afrique/l'Europe sur le modèle et le marqueur `paris` (près de l'axe Z bleu, vers le haut).
2. Essayer successivement via l'outil JavaScript du navigateur : `window.__calib(0,0,0)`, `(90,0,0)`, `(180,0,0)`, `(-90,0,0)`, puis avec `pitch` ±90 si les pôles ne sont pas sur l'axe Y (capture après chacun). L'export FBX → glTF impose souvent un `pitch` de ±90 ou un `yaw` de 180.
3. Affiner par pas de 1–5° jusqu'à ce que `paris` soit sur Paris, `japon` sur Tokyo, `bali` sur Bali (trois points non alignés ⇒ orientation unique). Tolérance : le marqueur (rayon 0,018 ≈ 115 km) recouvre la ville.
4. Lire `window.__calibGet()` et reporter dans `src/scene/globe.js` :
```js
export const CALIB = { yaw: <yawDeg> * Math.PI / 180, pitch: <pitchDeg> * Math.PI / 180, roll: <rollDeg> * Math.PI / 180 };
```
5. Recharger sans `?debug` puis avec : les marqueurs sont au bon endroit dès le chargement. Capture finale (Europe de face) à conserver dans le message de commit.

- [ ] **Step 4 : Commit**

```bash
git add src/scene/debug.js src/scene/globe.js src/main.js
git commit -m "Mode ?debug (marqueurs, OrbitControls) et calibration du modèle

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7 : Route en pointillés dorés

**Files:**
- Create: `src/scene/routeLogic.js`, `src/scene/route.js`, `test/routeLogic.test.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `SEGMENT_KEYS = ['0','1','2','3','4','5','6w','w7','67']`, `segmentProgress(state, key, flightProgress) → 0..1` (pur) ; `createDashedArc(a, b, opts) → { mesh, total, setProgress(t) }` ; `createRoute({ stopsVec, waitVec, finalVec }) → { group, showFor(state, flightProgress) }`.
- Consumes: `slerp/angleBetween/scale` (Task 2), `WAIT/FINAL/LAST_REAL` (Task 3).

- [ ] **Step 1 : Tests de `segmentProgress`**

`test/routeLogic.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { segmentProgress, SEGMENT_KEYS } from '../src/scene/routeLogic.js';
import { initialState, reduce, FINAL } from '../src/state.js';

const run = (s, ...a) => a.reduce((st, x) => reduce(st, typeof x === 'string' ? { type: x } : x), s);
const all = (s, p) => Object.fromEntries(SEGMENT_KEYS.map((k) => [k, segmentProgress(s, k, p)]));

describe('segmentProgress', () => {
  it('rien au départ', () => {
    const s = run(initialState(), 'START');
    expect(Object.values(all(s, 0)).every((v) => v === 0)).toBe(true);
  });
  it('le segment en vol suit la progression, les visités restent à 1', () => {
    let s = run(initialState(), 'START', 'NEXT', 'ARRIVED', 'NEXT');
    expect(segmentProgress(s, '0', 0.3)).toBe(1);
    expect(segmentProgress(s, '1', 0.3)).toBe(0.3);
    expect(segmentProgress(s, '2', 0.3)).toBe(0);
    s = run(s, 'ARRIVED', 'PREV');   // 2 → 1 en arrière : rien ne s efface
    expect(segmentProgress(s, '1', 0.5)).toBe(1);
  });
  it('6w pendant le vol vers l attente, puis w7 pendant UNLOCKING', () => {
    let s = run(initialState(), 'START');
    for (let i = 0; i < 6; i++) s = run(s, 'NEXT', 'ARRIVED');
    s = run(s, 'NEXT');
    expect(segmentProgress(s, '6w', 0.4)).toBe(0.4);
    expect(segmentProgress(s, '67', 0.4)).toBe(0);
    s = run(s, 'ARRIVED', 'OPEN_LOCK', 'CODE_OK');
    expect(s.phase).toBe('UNLOCKING');
    expect(segmentProgress(s, '6w', 0)).toBe(1);
    expect(segmentProgress(s, 'w7', 0.7)).toBe(0.7);
    s = run(s, 'LANDED');
    expect(segmentProgress(s, 'w7', 0)).toBe(1);
  });
  it('67 direct quand déjà déverrouillé', () => {
    let s = run(initialState({ unlocked: true, secretReady: true }), 'START');
    for (let i = 0; i < 6; i++) s = run(s, 'NEXT', 'ARRIVED');
    s = run(s, 'NEXT');
    expect(s.flight.to).toBe(FINAL);
    expect(segmentProgress(s, '67', 0.2)).toBe(0.2);
    expect(segmentProgress(s, '6w', 0.2)).toBe(0);
    expect(segmentProgress(run(s, 'ARRIVED'), '67', 0)).toBe(1);
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, `routeLogic.js` introuvable.

- [ ] **Step 3 : Implémenter `src/scene/routeLogic.js`**

```js
import { WAIT, FINAL, LAST_REAL } from '../state.js';

export const SEGMENT_KEYS = ['0', '1', '2', '3', '4', '5', '6w', 'w7', '67'];

// Progression d'affichage d'un segment (0 = absent, 1 = complet) selon l'état.
export function segmentProgress(s, key, flightProgress) {
  const flight = s.phase === 'FLYING' ? s.flight : s.phase === 'UNLOCKING' ? { from: WAIT, to: FINAL } : null;
  const flying = (from, to) => !!flight && flight.from === from && flight.to === to;
  const v = s.visited;
  if (/^\d$/.test(key)) {
    const i = Number(key);
    if (v.includes(i + 1)) return 1;
    return flying(i, i + 1) ? flightProgress : 0;
  }
  if (key === '6w') {
    if (s.waitReached) return 1;
    return flying(LAST_REAL, WAIT) ? flightProgress : 0;
  }
  if (key === 'w7') {
    if (!s.waitReached) return 0;
    if (v.includes(FINAL)) return 1;
    return flying(WAIT, FINAL) ? flightProgress : 0;
  }
  if (key === '67') {
    if (s.waitReached) return 0;
    if (v.includes(FINAL)) return 1;
    return flying(LAST_REAL, FINAL) ? flightProgress : 0;
  }
  return 0;
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : PASS.

- [ ] **Step 5 : Implémenter `src/scene/route.js`**

```js
import * as THREE from 'three';
import { slerp, angleBetween, scale } from '../lib/geo.js';
import { SEGMENT_KEYS, segmentProgress } from './routeLogic.js';

const GOLD = 0xd9b65c;

// Pointillé le long de l'arc a→b (vecteurs unitaires), tirets = petites boîtes instanciées.
export function createDashedArc(a, b, { altitude = 1.06, dash = 0.018, gap = 0.014, thickness = 0.006, color = GOLD } = {}) {
  const arcLen = angleBetween(a, b) * altitude;
  const total = Math.max(1, Math.floor(arcLen / (dash + gap)));
  const geo = new THREE.BoxGeometry(thickness, thickness, dash);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.InstancedMesh(geo, mat, total);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Vector3(), up = new THREE.Vector3();
  for (let i = 0; i < total; i++) {
    const t0 = (i * (dash + gap)) / arcLen, t1 = Math.min(1, t0 + dash / arcLen);
    const pa = scale(slerp(a, b, t0), altitude), pb = scale(slerp(a, b, t1), altitude);
    p.set((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2);
    q.set(pb.x, pb.y, pb.z);
    up.copy(p).normalize();
    m.lookAt(p, q, up);
    m.setPosition(p);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.count = 0;
  return { mesh, total, setProgress(t) { mesh.count = Math.round(Math.min(1, Math.max(0, t)) * total); } };
}

export function createRoute({ stopsVec, waitVec, finalVec }) {
  const group = new THREE.Group();
  const ends = {
    '6w': [stopsVec[6], waitVec], 'w7': [waitVec, finalVec], '67': [stopsVec[6], finalVec],
  };
  for (let i = 0; i < 6; i++) ends[String(i)] = [stopsVec[i], stopsVec[i + 1]];
  const arcs = {};
  for (const key of SEGMENT_KEYS) {
    arcs[key] = createDashedArc(ends[key][0], ends[key][1]);
    group.add(arcs[key].mesh);
  }
  return {
    group,
    showFor(state, flightProgress = 0) {
      for (const key of SEGMENT_KEYS) arcs[key].setProgress(segmentProgress(state, key, flightProgress));
    },
  };
}
```

- [ ] **Step 6 : Brancher dans `src/main.js` (aperçu complet temporaire)**

Imports :
```js
import { latLonToVec3 } from './lib/geo.js';
import { createRoute } from './scene/route.js';
import { initialState, WAIT } from './state.js';
```
Après le chargement du globe :
```js
const stopsVec = stops.map((s) => latLonToVec3(s.lat, s.lon));
const waitVec = latLonToVec3(mystery.waitPoint.lat, mystery.waitPoint.lon);
const finalVec = latLonToVec3(mystery.destination.lat, mystery.destination.lon);
const route = createRoute({ stopsVec, waitVec, finalVec });
globe.root.add(route.group);
// Aperçu temporaire : tout le trajet visité + attente atteinte (retiré en Task 9)
route.showFor({ ...initialState(), phase: 'LOCKED', stop: WAIT, visited: [0, 1, 2, 3, 4, 5, 6], waitReached: true }, 0);
```

- [ ] **Step 7 : Vérification visuelle**

Ouvrir `?debug`, capture face Europe puis face Asie (tourner avec la souris : `left_click_drag`). Expected : pointillés dorés fins reliant Paris → KL → Bali → Tokyo → Shanghai → Paris → Barcelone → point d'attente Atlantique, posés juste au-dessus du relief, sans traverser le globe (si un arc long « coupe » le globe, augmenter `altitude` à 1.07). Aucun segment vers Londres.

- [ ] **Step 8 : Commit**

```bash
git add src/scene/routeLogic.js src/scene/route.js src/main.js test/routeLogic.test.js
git commit -m "Route : pointillés dorés instanciés, progression par segment selon l état

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8 : Avion, caméra, runner de vol

**Files:**
- Create: `src/scene/planePose.js`, `src/scene/plane.js`, `src/scene/camera.js`, `src/app/flight.js`, `test/planePose.test.js`, `test/flight.test.js`
- Modify: `src/main.js`

**Interfaces:**
- Produces: `planePose(a, b, e, lift, base=1.07) → { position, target, up, roll }` et `restPose(at, headingTo, altitude=1.07)` (purs) ; `loadPlane(url) → Promise<THREE.Object3D>` (glb ou fallback procédural, nez vers +Z, envergure 0,12) ; `createPlane(model) → { object, setPose(pose) }` ; `createCameraRig(camera) → { setViewport(w,h), setMode('intro'|'travel'), setDirection(v, immediate=false), update(dt) }` ; `createFlightRunner() → { start({from, to, backwards, durationScale, onProgress(e, pos, flight), onDone}), active(), update(dt) }`.
- Consumes: `arcPoint/liftFor/flightDuration/slerp/…` (Task 2), `easeInOutCubic` (Task 2).

- [ ] **Step 1 : Tests**

`test/planePose.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { planePose, restPose } from '../src/scene/planePose.js';
import { latLonToVec3, length, sub, dot, normalize } from '../src/lib/geo.js';

const a = latLonToVec3(48.86, 2.35), b = latLonToVec3(35.68, 139.65);

describe('planePose', () => {
  it('position à base+lift au milieu, cible devant, up radial', () => {
    const p = planePose(a, b, 0.5, 0.2);
    expect(Math.abs(length(p.position) - 1.27)).toBeLessThan(1e-6);
    expect(Math.abs(length(p.up) - 1)).toBeLessThan(1e-6);
    expect(dot(normalize(p.position), p.up)).toBeGreaterThan(0.999);
    const ahead = sub(p.target, p.position);
    expect(length(ahead)).toBeGreaterThan(0);
    expect(dot(normalize(ahead), normalize(sub(b, a)))).toBeGreaterThan(0);   // va vers b
  });
  it('à e=1 la cible reste devant (pas de dégénérescence)', () => {
    const p = planePose(a, b, 1, 0.2);
    expect(length(sub(p.target, p.position))).toBeGreaterThan(0);
    expect(Math.abs(length(p.position) - 1.07)).toBeLessThan(1e-6);
  });
  it('roll nul aux extrémités, max au milieu', () => {
    expect(planePose(a, b, 0, 0.2).roll).toBeCloseTo(0, 6);
    expect(planePose(a, b, 0.5, 0.2).roll).toBeCloseTo(15 * Math.PI / 180, 6);
  });
  it('restPose pose à l altitude demandée, orienté vers la prochaine étape', () => {
    const r = restPose(a, b, 1.07);
    expect(Math.abs(length(r.position) - 1.07)).toBeLessThan(1e-6);
    expect(dot(normalize(sub(r.target, r.position)), normalize(sub(b, a)))).toBeGreaterThan(0);
  });
});
```

`test/flight.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { createFlightRunner } from '../src/app/flight.js';
import { latLonToVec3 } from '../src/lib/geo.js';

describe('flight runner', () => {
  it('progresse de 0 à 1, appelle onDone une seule fois', () => {
    const r = createFlightRunner();
    const seen = []; let done = 0;
    r.start({ from: latLonToVec3(48.86, 2.35), to: latLonToVec3(3.14, 101.69), onProgress: (e) => seen.push(e), onDone: () => done++ });
    expect(r.active()).toBe(true);
    for (let i = 0; i < 100; i++) r.update(0.05);   // 5 s > durée (≈2.5 s)
    expect(done).toBe(1);
    expect(r.active()).toBe(false);
    expect(seen[0]).toBeGreaterThanOrEqual(0);
    expect(seen[seen.length - 1]).toBe(1);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
  });
  it('durationScale raccourcit le vol', () => {
    const r = createFlightRunner();
    let done = 0;
    r.start({ from: latLonToVec3(0, 0), to: latLonToVec3(0, 90), durationScale: 0.1, onProgress() {}, onDone: () => done++ });
    for (let i = 0; i < 10; i++) r.update(0.05);   // 0.5 s
    expect(done).toBe(1);
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, modules introuvables.

- [ ] **Step 3 : Implémenter `src/scene/planePose.js` et `src/app/flight.js`**

`src/scene/planePose.js` :
```js
import { arcPoint, add, sub, normalize, scale, slerp, length } from '../lib/geo.js';

const BANK_MAX = 15 * Math.PI / 180;
const EPS = 0.01;

// Pose de l'avion en vol : a, b unitaires, e ∈ [0,1] (déjà easé).
export function planePose(a, b, e, lift, base = 1.07) {
  const position = arcPoint(a, b, e, lift, base);
  let dir;
  if (e < 1 - EPS) dir = sub(arcPoint(a, b, e + EPS, lift, base), position);
  else dir = sub(position, arcPoint(a, b, e - EPS, lift, base));
  return { position, target: add(position, normalize(dir)), up: normalize(position), roll: BANK_MAX * Math.sin(Math.PI * e) };
}

// Avion posé en `at`, nez vers `headingTo` (tangent). Si headingTo == at, cap arbitraire (est).
export function restPose(at, headingTo, altitude = 1.07) {
  const position = scale(normalize(at), altitude);
  const next = scale(slerp(at, headingTo, 0.02), altitude);
  let dir = sub(next, position);
  if (length(dir) < 1e-9) dir = { x: -position.z, y: 0, z: position.x };
  return { position, target: add(position, normalize(dir)), up: normalize(position), roll: 0 };
}
```

`src/app/flight.js` :
```js
import { angleBetween, liftFor, flightDuration, arcPoint } from '../lib/geo.js';
import { easeInOutCubic, clamp01 } from '../lib/ease.js';

export function createFlightRunner() {
  let cur = null;
  return {
    start({ from, to, backwards = false, durationScale = 1, onProgress, onDone }) {
      const angle = angleBetween(from, to);
      cur = { from, to, lift: liftFor(angle), duration: flightDuration(angle, backwards) * durationScale, elapsed: 0, onProgress, onDone };
    },
    active: () => cur !== null,
    update(dt) {
      if (!cur) return;
      cur.elapsed += dt;
      const t = clamp01(cur.elapsed / cur.duration);
      const e = easeInOutCubic(t);
      cur.onProgress(e, arcPoint(cur.from, cur.to, e, cur.lift), cur);
      if (t >= 1) { const f = cur; cur = null; f.onDone(); }
    },
  };
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : PASS.

- [ ] **Step 5 : Implémenter `src/scene/plane.js` et `src/scene/camera.js`**

`src/scene/plane.js` :
```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const WINGSPAN = 0.12;
// Rotation Y (rad) à appliquer au glb pour que son nez pointe vers +Z (à ajuster à l'œil si besoin).
const GLB_YAW = 0;

export function buildProceduralPlane() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b65c, roughness: 0.5, metalness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.09, 4, 8), gold);
  fuselage.rotation.x = Math.PI / 2; g.add(fuselage);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(WINGSPAN, 0.004, 0.022), gold); wing.position.z = -0.005; g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.003, 0.014), gold); tail.position.z = -0.05; g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.022, 0.016), dark); fin.position.set(0, 0.012, -0.05); g.add(fin);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), dark); nose.position.z = 0.056; g.add(nose);
  return g;
}

function normalizeGlb(sceneObj) {
  const box = new THREE.Box3().setFromObject(sceneObj);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const inner = new THREE.Group();
  sceneObj.position.sub(center);
  inner.add(sceneObj);
  inner.scale.setScalar(WINGSPAN / Math.max(size.x, size.y, size.z));
  const outer = new THREE.Group();
  inner.rotation.y = GLB_YAW;
  outer.add(inner);
  return outer;
}

export function loadPlane(url) {
  return new Promise((resolve) => {
    new GLTFLoader().load(url, (gltf) => resolve(normalizeGlb(gltf.scene)), undefined, () => {
      console.warn('plane.glb absent → avion procédural');
      resolve(buildProceduralPlane());
    });
  });
}

export function createPlane(model) {
  const object = new THREE.Group();
  object.add(model);
  const target = new THREE.Vector3();
  return {
    object,
    setPose({ position, target: t, up, roll }) {
      object.position.set(position.x, position.y, position.z);
      object.up.set(up.x, up.y, up.z);
      target.set(t.x, t.y, t.z);
      object.lookAt(target);        // pour un Object3D, +Z regarde la cible
      object.rotateZ(roll);
    },
  };
}
```

`src/scene/camera.js` :
```js
import * as THREE from 'three';
import { slerp, normalize } from '../lib/geo.js';

const DIST = { intro: 3.4, portrait: 2.6, landscape: 2.2 };

export function createCameraRig(camera) {
  let mode = 'intro', portrait = true;
  let dir = { x: 0, y: 0.25, z: 1 }, targetDir = dir;
  let distance = DIST.intro, targetDistance = DIST.intro, lookY = 0;
  const pos = new THREE.Vector3();
  const refresh = () => {
    targetDistance = mode === 'intro' ? DIST.intro : portrait ? DIST.portrait : DIST.landscape;
    lookY = mode === 'intro' || !portrait ? 0 : -0.3;
  };
  return {
    setViewport(w, h) {
      portrait = h > w;
      camera.aspect = w / h;
      camera.fov = portrait ? 45 : 38;
      camera.updateProjectionMatrix();
      refresh();
    },
    setMode(m) { mode = m; refresh(); },
    setDirection(v, immediate = false) { targetDir = normalize(v); if (immediate) dir = targetDir; },
    update(dt) {
      const k = 1 - Math.exp(-6 * dt);
      dir = slerp(dir, targetDir, k);
      distance += (targetDistance - distance) * k;
      pos.set(dir.x, dir.y, dir.z).multiplyScalar(distance);
      camera.position.copy(pos);
      camera.lookAt(0, lookY, 0);
    },
  };
}
```

- [ ] **Step 6 : Câbler un vol de démonstration dans `src/main.js`**

Remplacer les lignes de caméra fixe (`camera.position.set…`, `camera.lookAt…`) et `resize()` par :
```js
import { createCameraRig } from './scene/camera.js';
import { loadPlane, createPlane } from './scene/plane.js';
import { planePose, restPose } from './scene/planePose.js';
import { createFlightRunner } from './app/flight.js';
import { liftFor, angleBetween } from './lib/geo.js';
// …
const rig = createCameraRig(camera);
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  rig.setViewport(w, h);
}
const liftOf = (a, b) => liftFor(angleBetween(a, b));
```
Après la route :
```js
const plane = createPlane(await loadPlane(`${BASE}models/plane.glb`));
globe.root.add(plane.object);
plane.setPose(restPose(stopsVec[0], stopsVec[1]));
const flights = createFlightRunner();
const tmpWorld = new THREE.Vector3();
const toWorldDir = (v) => { tmpWorld.set(v.x, v.y, v.z); globe.root.localToWorld(tmpWorld); return { x: tmpWorld.x, y: tmpWorld.y, z: tmpWorld.z }; };

// Démo temporaire (retirée en Task 9) : touche N = vol vers l étape suivante
let demoIdx = 0;
window.addEventListener('keydown', (e) => {
  if (e.key !== 'n' || flights.active() || demoIdx >= 6) return;
  const from = stopsVec[demoIdx], to = stopsVec[demoIdx + 1];
  rig.setMode('travel');
  flights.start({
    from, to,
    onProgress: (e2) => { const p = planePose(from, to, e2, liftOf(from, to)); plane.setPose(p); rig.setDirection(toWorldDir(p.position)); },
    onDone: () => { demoIdx++; plane.setPose(restPose(to, demoIdx < 6 ? stopsVec[demoIdx + 1] : waitVec)); },
  });
});
```
Dans la boucle, avant `renderer.render` : `flights.update(dt); rig.update(dt);` et ne faire tourner le globe que si `!flights.active() && demoIdx === 0`.

- [ ] **Step 7 : Vérification visuelle**

Sans `?debug` : capture initiale (avion posé à Paris, minuscule mais visible, doré si procédural). Appuyer `n` (outil clavier), captures à ~0,8 s et ~1,6 s : l'avion suit un arc bombé vers KL, nez dans le sens du vol, la caméra suit et le garde centré ; à l'arrivée il se pose orienté vers Bali. Si l'avion vole « à l'envers » (queue devant) avec le glb : ajuster `GLB_YAW` à `Math.PI`. Si l'avion est enfoncé dans le relief : `reliefRadius` (Task 5) > 1.07 → passer `base` de `planePose` et l'altitude de la route au-dessus de cette valeur.

- [ ] **Step 8 : Commit**

```bash
git add src/scene/planePose.js src/scene/plane.js src/scene/camera.js src/app/flight.js src/main.js test/planePose.test.js test/flight.test.js
git commit -m "Avion (glb ou procédural), pose sur arc, rig caméra, runner de vol

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9 : Navigation (swipe/clavier/chevrons), timeline, carte d'étape, câblage du store

**Files:**
- Create: `src/ui/icons.js`, `src/ui/input.js`, `src/ui/timeline.js`, `src/ui/stopCard.js`, `test/input.test.js`
- Modify: `src/main.js` (réécriture complète : le store pilote tout, la démo `n` disparaît), `src/styles.css` (ajout)

**Interfaces:**
- Produces: `ICONS` (objet `{ paris, malaisie, bali, japon, shanghai, retour, barcelone, final, lock }` → chaînes SVG) ; `classifySwipe(dx, dy, dt, opts) → 'next'|'prev'|null` (pur) ; `bindInput(el, { onNext, onPrev })` ; `createChevrons(root, { onNext, onPrev }) → { render(state) }` ; `createTimeline(root, stops, { onSelect(i) }) → { render(state) }` ; `createStopCard(root) → { show({name, sub, dates}), hide() }`.
- Convention DOM : tout élément portant `data-no-swipe` (et ses descendants) ne déclenche pas de swipe.
- Consumes: `canNext/canPrev/canGoto/WAIT/FINAL` (Task 3), tout Task 5–8.

- [ ] **Step 1 : Test de `classifySwipe`**

`test/input.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { classifySwipe } from '../src/ui/input.js';

describe('classifySwipe', () => {
  it('gauche rapide = next, droite rapide = prev', () => {
    expect(classifySwipe(-80, 5, 120)).toBe('next');
    expect(classifySwipe(90, -10, 200)).toBe('prev');
  });
  it('trop court, trop lent ou vertical = rien', () => {
    expect(classifySwipe(-20, 0, 100)).toBe(null);
    expect(classifySwipe(-120, 0, 800)).toBe(null);
    expect(classifySwipe(-50, -90, 100)).toBe(null);
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, `input.js` introuvable.

- [ ] **Step 3 : Implémenter `src/ui/icons.js` et `src/ui/input.js`**

`src/ui/icons.js` :
```js
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${d}"/></svg>`;

export const ICONS = {
  paris: svg('M12 2 9.4 13h5.2L12 2zM7.5 14h9l2.5 8h-4l-3-4-3 4H5l2.5-8z'),
  malaisie: svg('M6 22V8l2-4 2 4v14H6zm8 0V8l2-4 2 4v14h-4zm-4-9h4v1.5h-4V13z'),
  bali: svg('M12 2l3 4H9l3-4zM8 7h8l2 4H6l2-4zM5 12h14v3H5v-3zM6 16h12v6H6v-6z'),
  japon: svg('M3 20L12 5l9 15H3zm6.2-9h5.6L12 7.5 9.2 11z'),
  shanghai: svg('M3 22V10h4v12H3zm6 0V4h5v18H9zm7 0V13h4v9h-4z'),
  retour: svg('M4 12l8-8 8 8v10h-6v-6h-4v6H4V12z'),
  barcelone: svg('M5 22V10l2-6 2 6v12H5zm5 0V7l2-5 2 5v15h-4zm5 0V10l2-6 2 6v12h-4z'),
  final: svg('M10 22V6l2-4 2 4v16h-4zM8.5 9h7v7h-7V9zm2 2v3h3v-3h-3z'),
  lock: svg('M6 11h12v11H6V11zm3 0V8a3 3 0 0 1 6 0v3h-2V8a1 1 0 0 0-2 0v3H9z'),
};

// Cachet scellé (carte de l'étape mystère), 96×96.
export const SEAL = `<svg viewBox="0 0 96 96" aria-hidden="true">
  <circle cx="48" cy="48" r="44" fill="none" stroke="#D9B65C" stroke-width="2"/>
  <circle cx="48" cy="48" r="37" fill="none" stroke="#D9B65C" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="48" y="64" text-anchor="middle" font-family="Anton, Impact, sans-serif" font-size="46" fill="#D9B65C">?</text>
</svg>`;
```

`src/ui/input.js` :
```js
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
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : PASS.

- [ ] **Step 5 : Implémenter `src/ui/timeline.js` et `src/ui/stopCard.js`**

`src/ui/timeline.js` :
```js
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
```

`src/ui/stopCard.js` :
```js
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
```

- [ ] **Step 6 : CSS (ajouter à `src/styles.css`)**

```css
/* l'attribut hidden doit gagner sur les display:flex des composants */
[hidden] { display: none !important; }

/* --- cartes --- */
.card {
  position: absolute; left: 16px; right: 16px; bottom: 84px;
  background: rgba(20, 20, 20, .85); border: 1px solid var(--or); border-radius: 12px;
  padding: 16px 18px; text-align: center;
  transform: translateY(120%); opacity: 0;
  transition: transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s;
}
.card.in { transform: none; opacity: 1; }
.card-name { font-family: var(--titre); font-size: 28px; letter-spacing: .04em; color: var(--or); margin: 0; font-weight: 400; }
.card-sub { font-style: italic; font-size: 14px; margin: 6px 0 0; }
.card-dates { font-size: 14px; opacity: .8; margin: 4px 0 0; }

/* --- timeline --- */
.timeline {
  position: absolute; left: 0; right: 0; bottom: 20px;
  display: flex; justify-content: center; gap: 10px; padding: 0 12px;
}
.timeline::before {
  content: ''; position: absolute; left: 12%; right: 12%; top: 50%;
  border-top: 1px dashed rgba(217,182,92,.35); z-index: -1;
}
.dot {
  width: 28px; height: 28px; border-radius: 50%; padding: 5px;
  border: 1.5px solid var(--or); background: var(--noir); color: var(--or); cursor: pointer;
  transition: transform .2s, background .2s;
}
.dot svg { width: 100%; height: 100%; display: block; }
.dot.current { background: var(--or); color: var(--noir); transform: scale(1.15); }
.dot.future { border-color: #555; color: #555; }
.dot:disabled { cursor: default; }

/* --- chevrons --- */
.chevron {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 64px; border: 0; background: transparent; color: var(--or);
  font-size: 44px; line-height: 1; cursor: pointer; opacity: .8;
}
.chevron-prev { left: 4px; } .chevron-next { right: 4px; }
```

- [ ] **Step 7 : Réécrire `src/main.js`**

```js
import * as THREE from 'three';
import { stops, mystery } from './content.js';
import { latLonToVec3, liftFor, angleBetween } from './lib/geo.js';
import { initialState, reduce, WAIT, FINAL, LAST_REAL } from './state.js';
import { createStore } from './app/store.js';
import { createFlightRunner } from './app/flight.js';
import { loadGlobe } from './scene/globe.js';
import { addLights } from './scene/lights.js';
import { createStars } from './scene/stars.js';
import { createRoute } from './scene/route.js';
import { loadPlane, createPlane } from './scene/plane.js';
import { planePose, restPose } from './scene/planePose.js';
import { createCameraRig } from './scene/camera.js';
import { setupDebug, isDebug } from './scene/debug.js';
import { bindInput, createChevrons } from './ui/input.js';
import { createTimeline } from './ui/timeline.js';
import { createStopCard } from './ui/stopCard.js';

const BASE = import.meta.env.BASE_URL;
const ui = document.getElementById('ui');

// ---------- rendu ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1026);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const rig = createCameraRig(camera);
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  rig.setViewport(w, h);
}
window.addEventListener('resize', resize);
resize();
addLights(scene);
scene.add(createStars());

// ---------- géographie ----------
const stopsVec = stops.map((s) => latLonToVec3(s.lat, s.lon));
const waitVec = latLonToVec3(mystery.waitPoint.lat, mystery.waitPoint.lon);
const finalVec = latLonToVec3(mystery.destination.lat, mystery.destination.lon);
const vecOf = (i) => (i === WAIT ? waitVec : i === FINAL ? finalVec : stopsVec[i]);
// Direction du nez de l'avion posé : la prochaine étape (à Londres : vers Paris, jamais vers lui-même).
const nextVec = (i) => (i === WAIT ? finalVec : i === FINAL ? stopsVec[0] : i === LAST_REAL ? waitVec : stopsVec[i + 1]);
const liftOf = (a, b) => liftFor(angleBetween(a, b));
const REST_ALT = { default: 1.07, wait: 1.1 };

// ---------- chargement ----------
const [globe, planeModel] = await Promise.all([
  loadGlobe(`${BASE}models/earth.glb`),
  loadPlane(`${BASE}models/plane.glb`),
]);
scene.add(globe.root);
const route = createRoute({ stopsVec, waitVec, finalVec });
globe.root.add(route.group);
const plane = createPlane(planeModel);
globe.root.add(plane.object);
const debug = isDebug()
  ? setupDebug({ globe, camera, renderer, points: [...stops, { name: 'londres', ...mystery.destination }, { name: 'wait', ...mystery.waitPoint }] })
  : null;

// ---------- état ----------
const store = createStore(initialState(), reduce);
const flights = createFlightRunner();
const tmp = new THREE.Vector3();
const toWorldDir = (v) => { tmp.set(v.x, v.y, v.z); globe.root.localToWorld(tmp); return { x: tmp.x, y: tmp.y, z: tmp.z }; };
let flightProgress = 0;

function restAt(stop) {
  plane.setPose(restPose(vecOf(stop), nextVec(stop), stop === WAIT ? REST_ALT.wait : REST_ALT.default));
  rig.setDirection(toWorldDir(vecOf(stop)));
}
function startFlight({ from, to, backwards }) {
  const a = vecOf(from), b = vecOf(to), lift = liftOf(a, b);
  flights.start({
    from: a, to: b, backwards,
    onProgress(e) {
      flightProgress = e;
      const p = planePose(a, b, e, lift);
      plane.setPose(p);
      rig.setDirection(toWorldDir(p.position));
    },
    onDone() { flightProgress = 0; store.dispatch({ type: 'ARRIVED' }); },
  });
}

// ---------- UI ----------
const dispatch = (type, extra = {}) => store.dispatch({ type, ...extra });
const timeline = createTimeline(ui, stops, { onSelect: (i) => dispatch('GOTO', { index: i }) });
const stopCard = createStopCard(ui);
const chevrons = createChevrons(ui, { onNext: () => dispatch('NEXT'), onPrev: () => dispatch('PREV') });
bindInput(document.body, { onNext: () => dispatch('NEXT'), onPrev: () => dispatch('PREV') });

store.subscribe((state, prev) => {
  if (prev.phase === 'INTRO') rig.setMode('travel');
  if (state.phase === 'FLYING' && prev.phase !== 'FLYING') { stopCard.hide(); startFlight(state.flight); }
  if (state.phase === 'AT_STOP' && prev.phase !== 'AT_STOP') { restAt(state.stop); stopCard.show(stops[state.stop]); }
  timeline.render(state);
  chevrons.render(state);
});
timeline.render(store.get());
chevrons.render(store.get());
restAt(0);

// Temporaire (l'écran d'accueil arrive en Task 12) : décollage immédiat.
dispatch('START');

// ---------- boucle ----------
let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (store.get().phase === 'INTRO' && !debug) globe.root.rotation.y += 0.05 * dt;
  flights.update(dt);
  route.showFor(store.get(), flightProgress);
  if (debug) debug.update(dt); else rig.update(dt);
  renderer.render(scene, camera);
});
```

- [ ] **Step 8 : Vérification visuelle (émulation 375 × 812)**

Captures attendues :
1. Chargement : caméra proche de Paris (globe remonté, carte « Paris / Où tout a commencé / Mars 2026 » en bas, timeline 8 pastilles dont Paris pleine, 7 grisées avec cadenas sur la 8e, chevron droit seul visible).
2. Swipe gauche (`left_click_drag` de (300,400) à (100,400) rapide) → vol vers la Malaisie ; capture à mi-vol : carte cachée, pointillé qui se dessine derrière l'avion.
3. Arrivée : carte « Malaisie / Kuala Lumpur · Langkawi », pastille 2 pleine, pastille 1 contour, deux chevrons.
4. Flèche gauche clavier → retour à Paris (vol inversé, pointillé conservé).
5. Tap sur la pastille 3 (Bali) depuis Paris : ignoré (non visitée, pas la suivante) ; tap sur la pastille 2 : vol vers la Malaisie.
Aucune erreur console.

- [ ] **Step 9 : Commit**

```bash
git add src/ui src/main.js src/styles.css test/input.test.js
git commit -m "Navigation swipe/clavier/chevrons, timeline, carte d étape, store branché

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10 : Verrou — « ? » flottant, carte cachet, pavé numérique, secret, persistance

**Files:**
- Create: `src/app/secret.js`, `src/ui/lockCard.js`, `src/ui/keypad.js`, `src/scene/effects.js`, `test/secret.test.js`
- Modify: `src/scene/plane.js` (ajout `hover`), `src/main.js`, `src/styles.css`

**Interfaces:**
- Produces: `createSecretVault({ url, fetchImpl? }) → { ready(): Promise, get(): object|null, tryCode(code): Promise<{ok, secret?, missing?}> }` (`missing: true` si `secret.enc` est absent/illisible ; sinon `ok:false` = mauvais code) ; `createLockCard(root, { onOpen }) → { show({ hint }), hide() }` ; `createKeypad(root, { length, onSubmit(code), onClose }) → { open(), close(), shake(message), success() }` ; `createQuestionMark(dirVec, altitude=1.25, size=0.16) → { object, update(dt, t), fadeOut(seconds), hide() }` ; `plane.hover(t)` (oscillation autour de la dernière pose).
- Consumes: `decryptSecret` (Task 4), `persist` (Task 4), `SEAL` (Task 9).

- [ ] **Step 1 : Test du coffre**

`test/secret.test.js` :
```js
import { describe, it, expect } from 'vitest';
import { createSecretVault } from '../src/app/secret.js';
import { seal } from '../scripts/sealLib.mjs';

const CONTENT = { destination: 'X', dates: 'Y', from: 'A', to: 'B', passengers: 'P', message: 'M' };
const fetchOf = (body) => async () => ({ ok: true, json: async () => body });

describe('secret vault', () => {
  it('bon code → secret en mémoire', async () => {
    const { sealed } = await seal('4321', CONTENT);
    const v = createSecretVault({ url: 'x', fetchImpl: fetchOf(sealed) });
    expect(v.get()).toBe(null);
    const r = await v.tryCode('4321');
    expect(r.ok).toBe(true); expect(r.secret).toEqual(CONTENT); expect(v.get()).toEqual(CONTENT);
  });
  it('mauvais code → ok:false, rien en mémoire', async () => {
    const { sealed } = await seal('4321', CONTENT);
    const v = createSecretVault({ url: 'x', fetchImpl: fetchOf(sealed) });
    expect(await v.tryCode('0000')).toEqual({ ok: false });
    expect(v.get()).toBe(null);
  });
  it('fichier absent (404) ou illisible → missing', async () => {
    const v404 = createSecretVault({ url: 'x', fetchImpl: async () => ({ ok: false, json: async () => null }) });
    expect(await v404.tryCode('4321')).toEqual({ ok: false, missing: true });
    const vBad = createSecretVault({ url: 'x', fetchImpl: async () => { throw new Error('réseau'); } });
    expect(await vBad.tryCode('4321')).toEqual({ ok: false, missing: true });
  });
});
```

- [ ] **Step 2 : Lancer pour vérifier l'échec**

Run : `npm test` — Expected : FAIL, `secret.js` introuvable.

- [ ] **Step 3 : Implémenter `src/app/secret.js`**

```js
import { decryptSecret } from '../lib/crypto.js';

// Coffre : charge secret.enc une fois ; la seule vérification du code est le succès du déchiffrement.
export function createSecretVault({ url, fetchImpl = (u) => globalThis.fetch(u) }) {
  let sealed = null, plain = null;
  const loading = fetchImpl(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { sealed = j; })
    .catch(() => { sealed = null; });
  return {
    ready: () => loading,
    get: () => plain,
    async tryCode(code) {
      await loading;
      if (!sealed) return { ok: false, missing: true };
      try {
        plain = await decryptSecret(code, sealed);
        return { ok: true, secret: plain };
      } catch {
        return { ok: false };
      }
    },
  };
}
```

- [ ] **Step 4 : Lancer les tests**

Run : `npm test` — Expected : PASS.

- [ ] **Step 5 : Implémenter `lockCard.js`, `keypad.js`, `effects.js`, `plane.hover`**

`src/ui/lockCard.js` :
```js
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
```

`src/ui/keypad.js` :
```js
export function createKeypad(root, { length, onSubmit, onClose }) {
  const el = document.createElement('div');
  el.className = 'keypad'; el.hidden = true; el.dataset.noSwipe = '';
  el.innerHTML = '<div class="keypad-slots"></div><p class="keypad-msg" aria-live="polite"></p><div class="keypad-grid"></div>';
  const slotsEl = el.querySelector('.keypad-slots');
  const slots = Array.from({ length }, () => { const s = document.createElement('span'); s.className = 'slot'; slotsEl.appendChild(s); return s; });
  const msg = el.querySelector('.keypad-msg');
  const grid = el.querySelector('.keypad-grid');
  let buf = '', busy = false, msgTimer = null;
  const draw = () => slots.forEach((s, i) => { s.textContent = buf[i] ?? ''; s.classList.toggle('filled', i < buf.length); });
  const press = (d) => {
    if (busy || buf.length >= length) return;
    buf += d; draw();
    if (buf.length === length) { busy = true; setTimeout(() => onSubmit(buf), 150); }
  };
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✕']) {
    const b = document.createElement('button');
    b.className = 'key'; b.textContent = k;
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
    close() { el.hidden = true; },
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
```

`src/scene/effects.js` :
```js
import * as THREE from 'three';

function goldCanvas(draw, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#D9B65C'; g.strokeStyle = '#D9B65C';
  g.shadowColor = 'rgba(217,182,92,.65)'; g.shadowBlur = size * 0.08;
  draw(g, size);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function sprite(tex, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}

// « ? » doré flottant au-dessus du point d'attente ; pulse doucement, peut se dissoudre.
export function createQuestionMark(dir, altitude = 1.25, size = 0.16) {
  const tex = goldCanvas((g, S) => {
    g.font = `bold ${S * 0.8}px Anton, Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('?', S / 2, S * 0.55);
  });
  const obj = sprite(tex, size);
  obj.position.set(dir.x * altitude, dir.y * altitude, dir.z * altitude);
  let fade = null;
  return {
    object: obj,
    update(dt, t) {
      if (fade) {
        fade.t += dt;
        obj.material.opacity = Math.max(0, 1 - fade.t / fade.d);
        if (fade.t >= fade.d) { obj.visible = false; fade = null; }
      } else {
        obj.scale.setScalar(size * (1 + 0.06 * Math.sin(t * 2)));
      }
    },
    fadeOut(seconds) { fade = { t: 0, d: seconds }; },
    hide() { obj.visible = false; },
  };
}
```

Dans `src/scene/plane.js`, remplacer `createPlane` par :
```js
export function createPlane(model) {
  const object = new THREE.Group();
  object.add(model);
  const target = new THREE.Vector3();
  const restDir = new THREE.Vector3(0, 0, 1);
  let restLen = 1.07;
  return {
    object,
    setPose({ position, target: t, up, roll }) {
      object.position.set(position.x, position.y, position.z);
      object.up.set(up.x, up.y, up.z);
      target.set(t.x, t.y, t.z);
      object.lookAt(target);        // pour un Object3D, +Z regarde la cible
      object.rotateZ(roll);
      restDir.copy(object.position).normalize();
      restLen = object.position.length();
    },
    // Flottement vertical ±0.01 (période 2 s) autour de la dernière pose.
    hover(t) { object.position.copy(restDir).multiplyScalar(restLen + 0.01 * Math.sin(Math.PI * t)); },
  };
}
```

- [ ] **Step 6 : CSS (ajouter)**

```css
/* --- carte verrouillée --- */
.lock-card .seal { width: 72px; margin: 0 auto 6px; }
.lock-card .seal svg { width: 100%; height: auto; display: block; }
.lock-hint { font-size: 15px; line-height: 1.45; margin: 8px 0 12px; }
.btn-or { font-family: var(--titre); letter-spacing: .08em; font-size: 15px; background: var(--or); color: var(--noir); border: 0; border-radius: 999px; padding: 10px 22px; cursor: pointer; }

/* --- pavé numérique --- */
.keypad {
  position: absolute; inset: 0; background: rgba(20,20,20,.92);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
  transition: opacity .4s;
}
.keypad.out { opacity: 0; }
.keypad-slots { display: flex; gap: 10px; }
.slot {
  width: 44px; height: 54px; border: 1.5px solid var(--or); border-radius: 8px;
  display: grid; place-items: center; font-family: var(--titre); font-size: 28px; color: var(--creme);
  transition: background .2s, color .2s;
}
.slot.ok { background: var(--or); color: var(--noir); }
.keypad.shake .keypad-slots { animation: shake .4s; }
@keyframes shake { 0%,100% { transform: none } 20%,60% { transform: translateX(-6px) } 40%,80% { transform: translateX(6px) } }
.keypad-msg { min-height: 1.4em; margin: 0; font-size: 14px; color: var(--creme); opacity: .9; }
.keypad-grid { display: grid; grid-template-columns: repeat(3, 72px); gap: 12px; }
.key {
  height: 60px; border-radius: 12px; border: 1px solid rgba(217,182,92,.5); background: transparent;
  color: var(--creme); font-family: var(--titre); font-size: 24px; cursor: pointer;
}
.key:active { background: rgba(217,182,92,.2); }
```

- [ ] **Step 7 : Câbler dans `src/main.js`**

Imports supplémentaires :
```js
import { persist } from './lib/persist.js';
import { createSecretVault } from './app/secret.js';
import { createLockCard } from './ui/lockCard.js';
import { createKeypad } from './ui/keypad.js';
import { createQuestionMark } from './scene/effects.js';
```
Tout en haut, après `const ui = …` :
```js
if (new URLSearchParams(location.search).has('reset')) { persist.reset(); location.replace(location.pathname); }
```
Remplacer `const store = createStore(initialState(), reduce);` par :
```js
const vault = createSecretVault({ url: `${BASE}secret.enc` });
const unlocked = persist.isUnlocked();
let secretReady = false;
if (unlocked && persist.getSessionCode()) secretReady = (await vault.tryCode(persist.getSessionCode())).ok;
const store = createStore(initialState({ unlocked, secretReady }), reduce);
```
Après `globe.root.add(plane.object);` :
```js
const qmark = createQuestionMark(waitVec);
globe.root.add(qmark.object);
if (unlocked) qmark.hide();
```
Dans la section UI :
```js
const lockCard = createLockCard(ui, { onOpen: () => dispatch('OPEN_LOCK') });
const keypad = createKeypad(ui, {
  length: mystery.codeLength,
  onClose: () => dispatch('CLOSE_LOCK'),
  async onSubmit(code) {
    const r = await vault.tryCode(code);
    if (r.ok) {
      persist.setUnlocked(); persist.setSessionCode(code);
      keypad.success();
      setTimeout(() => dispatch('CODE_OK'), 400);
    } else if (r.missing) {
      keypad.shake('Le secret est introuvable, contacte Mimi.');
    } else {
      dispatch('CODE_KO');
      keypad.shake('Pas encore… relis bien la carte.');
    }
  },
});
```
Dans le `store.subscribe`, ajouter :
```js
  if (state.phase === 'LOCKED' && prev.phase !== 'LOCKED') {
    restAt(state.stop);
    lockCard.show({ hint: state.reentry ? mystery.reentryHint : mystery.hint });
  }
  if (state.phase !== 'LOCKED' && prev.phase === 'LOCKED') lockCard.hide();
  if (state.lockOpen && !prev.lockOpen) keypad.open();
  if (!state.lockOpen && prev.lockOpen) keypad.close();
```
Dans la boucle, après `flights.update(dt);` :
```js
  const st = store.get();
  qmark.update(dt, now / 1000);
  if (st.phase === 'LOCKED' && st.stop === WAIT) plane.hover(now / 1000);
```
(et utiliser `st` pour `route.showFor(st, flightProgress)`).

- [ ] **Step 8 : Vérification visuelle**

1. Avancer jusqu'à Barcelone puis swipe : vol vers l'Atlantique, arrivée devant le « ? » doré qui pulse ; l'avion flotte ; carte cachet « Destination mystère », indice, bouton « Entrer le code » ; pastille 8 = cadenas plein (courante).
2. Tap « Entrer le code » → pavé plein écran, 6 cases. Taper `000000` → secousse, cases vidées, message « Pas encore… relis bien la carte. » (disparaît après 2 s). Swipe pendant le pavé → aucun vol.
3. Taper `123456` → cases en or, pavé qui se fond ; l'état passe à UNLOCKING (rien d'autre encore : la séquence arrive en Task 11 — vérifier en console `store` non exposé ? ajouter temporairement `window.__state = () => store.get()` puis le retirer avant commit).
4. `?reset` → tout revient à zéro.

- [ ] **Step 9 : Commit**

```bash
git add src/app/secret.js src/ui/lockCard.js src/ui/keypad.js src/scene/effects.js src/scene/plane.js src/main.js src/styles.css test/secret.test.js
git commit -m "Verrou : point d attente et « ? », carte cachet, pavé numérique, coffre chiffré, persistance

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11 : Révélation — séquence, particules, marqueur, billet recto/verso

**Files:**
- Create: `src/app/unlock.js`, `src/ui/ticket.js`
- Modify: `src/scene/effects.js` (ajout `createBurst`, `createDestinationMarker`), `src/main.js`, `src/styles.css`

**Interfaces:**
- Produces: `createBurst(dir, altitude=1.08, count=60) → { object, update(dt) → done:boolean }` ; `createDestinationMarker(dir, altitude=1.1, size=0.12) → { object, show() }` ; `createTicket(root, { onFlip }) → { show(secret, flipped), hide(), setFlipped(bool) }` ; `runUnlockSequence(deps)` où `deps = { qmark, lockCard, flights, plane, rig, toWorldDir, waitVec, finalVec, liftOf, onProgress(e), onArrive(), onLanded(), reducedMotion }`.
- Consumes: `planePose` (Task 8), `vault.get()` (Task 10).

- [ ] **Step 1 : Ajouter à `src/scene/effects.js`**

```js
// Éclat de particules dorées qui montent puis s'éteignent (1,2 s).
export function createBurst(dir, altitude = 1.08, count = 60) {
  const LIFE = 1.2;
  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[3 * i] = dir.x * altitude; pos[3 * i + 1] = dir.y * altitude; pos[3 * i + 2] = dir.z * altitude;
    const rx = Math.random() - 0.5, ry = Math.random() - 0.5, rz = Math.random() - 0.5;
    const speed = 0.25 + Math.random() * 0.35;
    vel[3 * i] = (dir.x + rx) * speed; vel[3 * i + 1] = (dir.y + ry) * speed; vel[3 * i + 2] = (dir.z + rz) * speed;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xd9b65c, size: 0.02, transparent: true, opacity: 1, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  let life = 0;
  return {
    object: points,
    update(dt) {
      life += dt;
      for (let i = 0; i < count * 3; i++) { pos[i] += vel[i] * dt; vel[i] *= 0.96; }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - life / LIFE);
      return life >= LIFE;
    },
  };
}

// Big Ben stylisé (silhouette dorée) au-dessus de la destination.
export function createDestinationMarker(dir, altitude = 1.1, size = 0.12) {
  const tex = goldCanvas((g, S) => {
    const u = S / 24;
    g.fillRect(9 * u, 7 * u, 6 * u, 15 * u);                        // tour
    g.beginPath(); g.moveTo(8 * u, 7 * u); g.lineTo(12 * u, 2 * u); g.lineTo(16 * u, 7 * u); g.closePath(); g.fill();   // flèche
    g.fillStyle = '#0B1026'; g.beginPath(); g.arc(12 * u, 11 * u, 2.2 * u, 0, Math.PI * 2); g.fill();                  // cadran
    g.fillStyle = '#D9B65C'; g.beginPath(); g.arc(12 * u, 11 * u, 1.4 * u, 0, Math.PI * 2); g.fill();
  });
  const obj = sprite(tex, size);
  obj.position.set(dir.x * altitude, dir.y * altitude, dir.z * altitude);
  obj.visible = false;
  return { object: obj, show() { obj.visible = true; } };
}
```

- [ ] **Step 2 : Implémenter `src/app/unlock.js`**

```js
import { planePose } from '../scene/planePose.js';

// Séquence de révélation : le « ? » se dissout, l'avion vole vers la destination, éclat, puis onLanded.
export function runUnlockSequence({ qmark, lockCard, flights, plane, rig, toWorldDir, waitVec, finalVec, liftOf, onProgress, onArrive, onLanded, reducedMotion }) {
  qmark.fadeOut(0.6);
  lockCard.hide();
  const lift = liftOf(waitVec, finalVec);
  setTimeout(() => {
    flights.start({
      from: waitVec, to: finalVec, durationScale: reducedMotion ? 0.15 : 1,
      onProgress(e) {
        onProgress(e);
        const p = planePose(waitVec, finalVec, e, lift);
        plane.setPose(p);
        rig.setDirection(toWorldDir(p.position));
      },
      onDone() { onProgress(1); onArrive(); setTimeout(onLanded, 500); },   // 1 : le segment reste tracé jusqu à LANDED
    });
  }, 400);
}
```

- [ ] **Step 3 : Implémenter `src/ui/ticket.js`**

```js
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
```

- [ ] **Step 4 : CSS (ajouter)**

```css
/* --- billet --- */
.ticket-wrap {
  position: absolute; left: 50%; bottom: 84px; transform: translate(-50%, 120%); opacity: 0;
  width: min(340px, calc(100vw - 32px)); perspective: 1200px;
  transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s;
}
.ticket-wrap.in { transform: translate(-50%, 0); opacity: 1; }
.ticket { position: relative; width: 100%; height: 170px; transform-style: preserve-3d; transition: transform .6s; cursor: pointer; }
.ticket.flipped { transform: rotateY(180deg); }
.ticket-face {
  position: absolute; inset: 0; backface-visibility: hidden; border-radius: 10px;
  background: var(--noir); border: 1px solid var(--or); color: var(--creme); overflow: hidden;
}
.ticket-back { transform: rotateY(180deg); padding: 16px 18px; display: flex; flex-direction: column; }
.t-band { background: var(--or); color: var(--noir); font-family: var(--titre); letter-spacing: .14em; font-size: 11px; padding: 5px 12px; }
.t-route { display: flex; gap: 8px; align-items: baseline; padding: 8px 12px 0; font-size: 10px; letter-spacing: .08em; opacity: .85; }
.t-arrow { color: var(--or); }
.t-dest { font-family: var(--titre); font-size: 34px; color: var(--or); padding: 2px 12px 0; letter-spacing: .04em; }
.t-dates { font-family: var(--titre); font-size: 16px; padding: 0 12px; letter-spacing: .1em; }
.t-pax { font-size: 11px; padding: 6px 12px 0; opacity: .8; letter-spacing: .06em; }
.t-stub {
  position: absolute; top: 0; right: 0; bottom: 0; width: 46px; border-left: 1px dashed var(--or);
  display: grid; place-items: center;
}
.t-stub span { transform: rotate(-90deg); font-family: var(--titre); font-size: 12px; color: var(--or); letter-spacing: .18em; white-space: nowrap; }
.t-msg { flex: 1; overflow: auto; font-size: 14px; line-height: 1.5; white-space: pre-line; }
.t-sign { font-family: var(--titre); color: var(--or); text-align: right; letter-spacing: .1em; margin-top: 8px; }
.ticket-hint { text-align: center; font-size: 12px; opacity: .6; margin: 8px 0 0; font-style: italic; }
```

- [ ] **Step 5 : Câbler dans `src/main.js`**

Imports :
```js
import { createQuestionMark, createBurst, createDestinationMarker } from './scene/effects.js';
import { createTicket } from './ui/ticket.js';
import { runUnlockSequence } from './app/unlock.js';
```
Après le `qmark` :
```js
const marker = createDestinationMarker(finalVec);
globe.root.add(marker.object);
const bursts = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```
Section UI :
```js
const ticket = createTicket(ui, { onFlip: () => dispatch('FLIP_TICKET') });
```
Dans `store.subscribe`, ajouter :
```js
  if (state.phase === 'UNLOCKING' && prev.phase !== 'UNLOCKING') {
    runUnlockSequence({
      qmark, lockCard, flights, plane, rig, toWorldDir, waitVec, finalVec, liftOf, reducedMotion,
      onProgress: (e) => { flightProgress = e; },
      onArrive: () => {
        if (!reducedMotion) { const b = createBurst(finalVec); globe.root.add(b.object); bursts.push(b); }
        marker.show();
      },
      onLanded: () => dispatch('LANDED'),
    });
  }
  if (state.phase === 'REVEALED' && prev.phase !== 'REVEALED') {
    restAt(FINAL);
    marker.show();
    ticket.show(vault.get(), state.ticketFlipped);
  }
  if (state.phase !== 'REVEALED' && prev.phase === 'REVEALED') ticket.hide();
  if (state.ticketFlipped !== prev.ticketFlipped) ticket.setFlipped(state.ticketFlipped);
```
Dans la boucle, après `qmark.update(...)` :
```js
  for (let i = bursts.length - 1; i >= 0; i--) {
    if (bursts[i].update(dt)) { globe.root.remove(bursts[i].object); bursts.splice(i, 1); }
  }
```
Au démarrage, après la création du `marker` : `if (unlocked) marker.show();`.

- [ ] **Step 6 : Vérification visuelle**

1. Arriver au verrou, entrer `123456` : le « ? » se dissout, le pointillé se prolonge vers Londres pendant que l'avion y vole, la caméra suit ; éclat de particules dorées à l'arrivée ; marqueur Big Ben ; 0,5 s plus tard le billet glisse (recto : bandeau or, `GARE DE DÉPART → GARE D'ARRIVÉE`, « QUELQUE PART », « BIENTÔT », « NANO & MIMI », talon « SURPRISE ») ; pastille 8 = icône Big Ben pleine.
2. Tap sur le billet : retournement, verso avec le message de test et « Mimi » ; le texte « touche le billet » disparaît.
3. Swipe droite → retour à Barcelone (billet caché) ; swipe gauche → vol direct Barcelone → Londres (pas de « ? »), billet réaffiché sans particules.
4. Recharger la page : arrivée à Londres directe, billet affiché (code en session). Fermer l'onglet, rouvrir : la carte demande « Entre à nouveau le code… » ; `123456` → billet immédiat.
5. Captures : mi-vol de révélation, éclat, billet recto, billet verso.

- [ ] **Step 7 : Commit**

```bash
git add src/app/unlock.js src/ui/ticket.js src/scene/effects.js src/main.js src/styles.css
git commit -m "Révélation : séquence d atterrissage, particules, marqueur, billet recto/verso

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12 : Accueil, chargement, responsive, accessibilité, README

**Files:**
- Create: `src/ui/intro.js`, `README.md`
- Modify: `src/main.js`, `src/styles.css`

**Interfaces:**
- Produces: `createIntro(root, { title, tagline, credits, onStart }) → { setProgress(p), setReady(), hide() }`.
- Consumes: `title/tagline/credits` (Task 4).

- [ ] **Step 1 : Implémenter `src/ui/intro.js`**

```js
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
```

- [ ] **Step 2 : CSS (ajouter)**

```css
/* --- accueil --- */
.intro {
  position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  padding: 0 24px 56px; text-align: center; background: linear-gradient(180deg, rgba(11,16,38,0) 40%, rgba(11,16,38,.85) 100%);
  transition: opacity .6s;
}
.intro.out { opacity: 0; pointer-events: none; }
.intro-title { font-family: var(--titre); font-weight: 400; font-size: 40px; color: var(--or); letter-spacing: .04em; margin: 0 0 18px; text-shadow: 0 2px 24px rgba(0,0,0,.6); }
.intro-progress { width: 180px; height: 3px; background: rgba(217,182,92,.25); border-radius: 2px; overflow: hidden; }
.intro-bar { height: 100%; width: 0; background: var(--or); transition: width .2s; }
.intro-tagline { font-size: 15px; letter-spacing: .12em; text-transform: uppercase; color: var(--creme); animation: pulse 2.2s ease-in-out infinite; margin: 0; }
@keyframes pulse { 0%,100% { opacity: .45 } 50% { opacity: 1 } }
.intro-credits { position: absolute; bottom: 14px; left: 0; right: 0; font-size: 10px; opacity: .5; margin: 0; }

/* --- pas de WebGL --- */
.nowebgl { position: absolute; inset: 0; display: grid; place-items: center; padding: 32px; text-align: center; font-size: 16px; line-height: 1.5; }

/* --- paysage / desktop --- */
@media (orientation: landscape) and (min-width: 700px) {
  .card, .ticket-wrap { left: auto; right: 24px; bottom: auto; top: 50%; width: 320px; transform: translate(40px, -50%); }
  .card.in, .ticket-wrap.in { transform: translate(0, -50%); }
  .timeline { bottom: 24px; }
  .chevron-next { right: 360px; }
}

/* --- mouvement réduit --- */
@media (prefers-reduced-motion: reduce) {
  .card, .ticket-wrap, .intro, .ticket { transition-duration: .01s; }
  .intro-tagline { animation: none; opacity: 1; }
}
```

- [ ] **Step 3 : Câbler dans `src/main.js`**

Tout en haut (avant tout accès WebGL) :
```js
import { title, tagline, credits } from './content.js';
import { createIntro } from './ui/intro.js';

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (!hasWebGL()) {
  ui.innerHTML = '<div class="nowebgl">Ton navigateur ne peut pas afficher le globe — essaie avec Safari ou Chrome.</div>';
  throw new Error('WebGL indisponible');
}
```
Remplacer le chargement par une version avec progression :
```js
const intro = createIntro(ui, { title, tagline, credits, onStart: () => dispatch('START') });
const progress = { globe: 0, plane: 0 };
const report = () => intro.setProgress(progress.globe * 0.8 + progress.plane * 0.2);
const [globe, planeModel] = await Promise.all([
  loadGlobe(`${BASE}models/earth.glb`, (p) => { progress.globe = p; report(); }),
  loadPlane(`${BASE}models/plane.glb`).then((m) => { progress.plane = 1; report(); return m; }),
]);
```
(`dispatch` doit être défini avant `createIntro` : déplacer `const dispatch = …` juste après la création du store, et créer l'intro après le store — l'ordre final : rendu → géographie → vault/store/dispatch → intro → chargement → scène → UI.)
Supprimer la ligne temporaire `dispatch('START');`. Après la création de toute l'UI :
```js
restAt(0);
rig.setDirection({ x: 0.2, y: 0.35, z: 1 }, true);   // vue d'ensemble, Europe/Afrique de face
intro.setReady();
```
Dans le `store.subscribe`, remplacer `if (prev.phase === 'INTRO') rig.setMode('travel');` par :
```js
  if (prev.phase === 'INTRO') { rig.setMode('travel'); intro.hide(); }
```
Mouvement réduit : passer `durationScale: reducedMotion ? 0.15 : 1` dans `flights.start` de `startFlight`, et dans la boucle ne faire tourner le globe en INTRO que si `!reducedMotion`.
Viewport iOS : après `window.addEventListener('resize', resize);` ajouter `window.visualViewport?.addEventListener('resize', resize);`.

- [ ] **Step 4 : `README.md`**

```markdown
# Le voyage de Nano

Site secret 3D (three.js) : un avion rejoue le voyage étape par étape sur un globe cartoon ; la dernière étape est verrouillée par un code et révèle un billet.

## Modifier le contenu
Tout est dans `src/content.js` : titre, étapes (nom, sous-titre, dates, coordonnées), indice de l'étape mystère, longueur du code.

## Sceller le secret (code + billet + message)
```bash
npm install
npm run seal
```
Le script demande le contenu du billet, le message du verso et le code (masqué). Il écrit `public/secret.enc` (chiffré AES-GCM, clé dérivée du code par PBKDF2). Le code et le contenu en clair ne sont jamais enregistrés, et aucun hash du code n'est publié : seul le bon code déchiffre le fichier. Mets `mystery.codeLength` à la longueur du code choisi.

## Développer
```bash
npm run dev      # http://localhost:5173/
npm test         # tests unitaires
npm run build    # dossier dist/
```
`?debug` dans l'URL : marqueurs rouges sur les villes + rotation libre à la souris. `?reset` : efface le déverrouillage mémorisé.

## Déployer
Le repo est importé dans Vercel (preset Vite, sortie `dist/`) : chaque push sur `main` déclenche un build et une mise en ligne sur https://nano-adventure.vercel.app/

## Crédits
Globe : « Low Poly Planet Earth » par Jacobs Development (CC BY 4.0). Avion : « Airplane » par Poly by Google (CC BY 3.0).
```

- [ ] **Step 5 : Vérification finale**

1. Portrait 375 × 812 : accueil (titre or, barre puis « TOUCHE POUR DÉCOLLER » qui pulse, crédits en bas, globe entier qui tourne) → tap → la caméra glisse vers Paris, la carte apparaît, l'intro se fond.
2. Paysage 812 × 375 et desktop 1440 × 900 : carte et billet en colonne à droite, timeline en bas, globe centré dans l'espace restant, chevron droit décalé.
3. Parcours complet jusqu'au billet en portrait, sans erreur console ; `npm test` vert ; `npm run build` OK.
4. Captures : accueil, paysage, desktop.

- [ ] **Step 6 : Commit**

```bash
git add src/ui/intro.js src/main.js src/styles.css README.md
git commit -m "Écran d accueil avec progression, responsive paysage/desktop, mouvement réduit, README

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Après le plan

- Denis télécharge l'avion (Poly Pizza, glTF) → `public/models/plane.glb` ; vérifier le sens du nez (`GLB_YAW`) et la taille.
- Denis renseigne `content.js` (dates, ville du Japon, indice) puis `npm run seal` avec le vrai code et le vrai billet.
- Denis pousse ; Vercel publie ; test réel sur iPhone.
