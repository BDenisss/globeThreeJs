import * as THREE from 'three';
import { stops, mystery, title, tagline, credits } from './content.js';
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
import { persist } from './lib/persist.js';
import { createSecretVault } from './app/secret.js';
import { createLockCard } from './ui/lockCard.js';
import { createKeypad } from './ui/keypad.js';
import { createQuestionMark, createBurst, createDestinationMarker } from './scene/effects.js';
import { createTicket } from './ui/ticket.js';
import { runUnlockSequence } from './app/unlock.js';
import { createIntro } from './ui/intro.js';

const BASE = import.meta.env.BASE_URL;
const ui = document.getElementById('ui');

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (!hasWebGL()) {
  ui.innerHTML = '<div class="nowebgl">Ton navigateur ne peut pas afficher le globe — essaie avec Safari ou Chrome.</div>';
  throw new Error('WebGL indisponible');
}

if (new URLSearchParams(location.search).has('reset')) {
  persist.reset(); location.replace(location.pathname);
  throw new Error('reset');   // stoppe le module : sinon renderer, fetch et modèles démarrent pour rien pendant la navigation
}
// Déclaré tôt : utilisé par le « ? » (chargement) et par le coffre (état).
const unlocked = persist.isUnlocked();

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
window.visualViewport?.addEventListener('resize', resize);
resize();
addLights(scene);
scene.add(createStars());

// ---------- géographie ----------
const stopsVec = stops.map((s) => latLonToVec3(s.lat, s.lon));
const waitVec = latLonToVec3(mystery.waitPoint.lat, mystery.waitPoint.lon);
const finalVec = latLonToVec3(mystery.destination.lat, mystery.destination.lon);
// Vecteurs décalés vers le nord pour le « ? » et le marqueur : sinon ils sont sur la même radiale que l'avion (superposés à l'écran).
const qmarkVec = latLonToVec3(mystery.waitPoint.lat + 4, mystery.waitPoint.lon);
const markerVec = latLonToVec3(mystery.destination.lat + 4, mystery.destination.lon);
const vecOf = (i) => (i === WAIT ? waitVec : i === FINAL ? finalVec : stopsVec[i]);
// Direction du nez de l'avion posé : la prochaine étape (à Londres : vers Paris, jamais vers lui-même).
// Au point d'attente, cap neutre vers le nord (pas vers la destination, qui reste un secret).
const NORTH = { x: 0, y: 1, z: 0 };
const nextVec = (i) => (i === WAIT ? NORTH : i === FINAL ? stopsVec[0] : i === LAST_REAL ? waitVec : stopsVec[i + 1]);
const liftOf = (a, b) => liftFor(angleBetween(a, b));
const REST_ALT = { default: 1.13, wait: 1.16 };

// ---------- état ----------
const vault = createSecretVault({ url: `${BASE}secret.enc` });
let secretReady = false;
if (unlocked && persist.getSessionCode()) secretReady = (await vault.tryCode(persist.getSessionCode())).ok;
const store = createStore(initialState({ unlocked, secretReady }), reduce);
const dispatch = (type, extra = {}) => store.dispatch({ type, ...extra });
const flights = createFlightRunner();
let flightProgress = 0;

// ---------- accueil ----------
const intro = createIntro(ui, { title, tagline, credits, onStart: () => dispatch('START') });
const progress = { globe: 0, plane: 0 };
const report = () => intro.setProgress(progress.globe * 0.8 + progress.plane * 0.2);

// ---------- chargement ----------
let globe, planeModel;
try {
  [globe, planeModel] = await Promise.all([
    loadGlobe(`${BASE}models/earth.glb`, (p) => { progress.globe = p; report(); }),
    loadPlane(`${BASE}models/plane.glb`).then((m) => { progress.plane = 1; report(); return m; }),
  ]);
} catch (err) {
  console.error(err);
  intro.setError('Le globe n\'a pas pu se charger — vérifie ta connexion et recharge.');
  throw err;
}

// ---------- scène ----------
scene.add(globe.root);
const route = createRoute({ stopsVec, waitVec, finalVec });
globe.root.add(route.group);
const plane = createPlane(planeModel);
globe.root.add(plane.object);
const qmark = createQuestionMark(qmarkVec);
globe.root.add(qmark.object);
if (unlocked) qmark.hide();
const marker = createDestinationMarker(markerVec);
globe.root.add(marker.object);
if (unlocked) marker.show();
const bursts = [];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// `import.meta.env.DEV` répété ici (en plus de isDebug()) : replié en dur par Vite au build, ce qui permet
// au bundler d'éliminer statiquement tout cet appel (et OrbitControls) du bundle de production.
const debug = import.meta.env.DEV && isDebug()
  ? setupDebug({ globe, camera, renderer, points: [...stops, { name: 'final', ...mystery.destination }, { name: 'wait', ...mystery.waitPoint }] })
  : null;
const tmp = new THREE.Vector3();
const toWorldDir = (v) => { tmp.set(v.x, v.y, v.z); globe.root.localToWorld(tmp); return { x: tmp.x, y: tmp.y, z: tmp.z }; };

function restAt(stop) {
  plane.setPose(restPose(vecOf(stop), nextVec(stop), stop === WAIT ? REST_ALT.wait : REST_ALT.default));
  rig.setDirection(toWorldDir(vecOf(stop)));
}
function startFlight({ from, to, backwards }) {
  const a = vecOf(from), b = vecOf(to), lift = liftOf(a, b);
  flights.start({
    from: a, to: b, backwards, durationScale: reducedMotion ? 0.5 : 1,   // mouvement réduit : vols deux fois plus courts, sans recul de caméra
    onProgress(e) {
      flightProgress = e;
      const p = planePose(a, b, e, lift);
      plane.setPose(p);
      rig.setDirection(toWorldDir(p.position));
      rig.setZoomOut(reducedMotion ? 0 : Math.sin(Math.PI * e));   // recul en cloche : 1,6× à mi-vol, retour sur l'étape à l'arrivée
    },
    onDone() { flightProgress = 0; rig.setZoomOut(0); store.dispatch({ type: 'ARRIVED' }); },
  });
}

// ---------- UI ----------
const timeline = createTimeline(ui, stops, { onSelect: (i) => dispatch('GOTO', { index: i }) });
const stopCard = createStopCard(ui);
const chevrons = createChevrons(ui, { onNext: () => dispatch('NEXT'), onPrev: () => dispatch('PREV') });
bindInput(document.body, { onNext: () => dispatch('NEXT'), onPrev: () => dispatch('PREV') });
const lockCard = createLockCard(ui, { onOpen: () => dispatch('OPEN_LOCK') });
const keypad = createKeypad(ui, {
  length: mystery.codeLength,
  onClose: () => dispatch('CLOSE_LOCK'),
  async onSubmit(code) {
    const r = await vault.tryCode(code);
    if (!store.get().lockOpen) return; // pavé fermé pendant le déchiffrement : résultat ignoré, rien à persister
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
const ticket = createTicket(ui, { onFlip: () => dispatch('FLIP_TICKET') });

store.subscribe((state, prev) => {
  if (prev.phase === 'INTRO') { rig.setMode('travel'); intro.hide(); }
  if (state.phase === 'FLYING' && prev.phase !== 'FLYING') { stopCard.hide(); startFlight(state.flight); }
  if (state.phase === 'AT_STOP' && prev.phase !== 'AT_STOP') { restAt(state.stop); stopCard.show(stops[state.stop]); }
  if (state.phase === 'LOCKED' && prev.phase !== 'LOCKED') {
    restAt(state.stop);
    lockCard.show({ hint: state.reentry ? mystery.reentryHint : mystery.hint });
  }
  if (state.phase !== 'LOCKED' && prev.phase === 'LOCKED') lockCard.hide();
  if (state.lockOpen && !prev.lockOpen) keypad.open();
  if (!state.lockOpen && prev.lockOpen) keypad.close();
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
    // L'avion vient d'atterrir (depuis UNLOCKING) : ne pas le réorienter d'un coup.
    if (prev.phase !== 'UNLOCKING') restAt(FINAL);
    marker.show();
    ticket.show(vault.get(), state.ticketFlipped);
  }
  if (state.phase !== 'REVEALED' && prev.phase === 'REVEALED') ticket.hide();
  if (state.ticketFlipped !== prev.ticketFlipped) ticket.setFlipped(state.ticketFlipped);
  timeline.render(state);
  chevrons.render(state);
});
timeline.render(store.get());
chevrons.render(store.get());
restAt(0);
rig.setDirection({ x: 0.2, y: 0.35, z: 1 }, true);   // vue d'ensemble, Europe/Afrique de face
intro.setReady();

// ---------- boucle ----------
let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (store.get().phase === 'INTRO' && !debug && !reducedMotion) globe.root.rotation.y += 0.05 * dt;
  flights.update(dt);
  const st = store.get();
  qmark.update(dt, now / 1000);
  for (let i = bursts.length - 1; i >= 0; i--) {
    if (bursts[i].update(dt)) { globe.root.remove(bursts[i].object); bursts.splice(i, 1); }
  }
  if (st.phase === 'LOCKED' && st.stop === WAIT) plane.hover(now / 1000);
  route.showFor(st, flightProgress);
  if (debug) debug.update(dt); else rig.update(dt);
  renderer.render(scene, camera);
});
