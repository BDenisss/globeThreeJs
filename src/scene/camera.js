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
