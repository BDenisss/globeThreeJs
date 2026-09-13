import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { latLonToVec3, DEG } from '../lib/geo.js';
import { CALIB } from './globe.js';

export const isDebug = () => new URLSearchParams(location.search).has('debug');

// points : [{ name, lat, lon }] — un marqueur rouge par point, à l'altitude 1.12 (au-dessus des continents).
export function setupDebug({ globe, camera, renderer, points }) {
  const mat = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  const geo = new THREE.SphereGeometry(0.018, 12, 12);
  for (const p of points) {
    const m = new THREE.Mesh(geo, mat);
    const v = latLonToVec3(p.lat, p.lon, 1.12);
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
