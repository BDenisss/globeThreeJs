import * as THREE from 'three';
import { slerp, normalize } from '../lib/geo.js';

const DIST = { portrait: 2.6, landscape: 2.2 };
// Distance caméra de l'intro, recalculée dans setViewport() (globe entier visible, marge 8 %).
let introDistance = 3.4;

export function createCameraRig(camera) {
  let mode = 'intro', portrait = true;
  let dir = { x: 0, y: 0.25, z: 1 }, targetDir = dir;
  let distance = introDistance, targetDistance = introDistance, lookY = 0;
  const pos = new THREE.Vector3();
  const refresh = () => {
    targetDistance = mode === 'intro' ? introDistance : portrait ? DIST.portrait : DIST.landscape;
    lookY = mode === 'intro' || !portrait ? 0 : -0.3;
  };
  return {
    setViewport(w, h) {
      portrait = h > w;
      camera.aspect = w / h;
      camera.fov = portrait ? 45 : 38;
      camera.updateProjectionMatrix();
      // Demi-angle de champ le plus contraignant (vertical ou horizontal) : rayon max du relief (1,136) × marge 8 % / sin(demi-angle).
      const vfov = camera.fov * Math.PI / 180;
      const aspect = w / h;
      const half = Math.min(vfov / 2, Math.atan(Math.tan(vfov / 2) * aspect));
      introDistance = 1.136 * 1.08 / Math.sin(half);
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
