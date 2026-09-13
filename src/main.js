import * as THREE from 'three';
import { loadGlobe } from './scene/globe.js';
import { addLights } from './scene/lights.js';
import { createStars } from './scene/stars.js';
import { setupDebug, isDebug } from './scene/debug.js';
import { stops, mystery } from './content.js';

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

const debug = isDebug()
  ? setupDebug({ globe, camera, renderer, points: [...stops, { name: 'londres', ...mystery.destination }, { name: 'wait', ...mystery.waitPoint }] })
  : null;

let last = performance.now();
renderer.setAnimationLoop((now) => {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (debug) debug.update(dt); else globe.root.rotation.y += 0.05 * dt;
  renderer.render(scene, camera);
});
