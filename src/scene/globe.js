import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { fitSphere } from './globeFit.js';

// Rotation de correction du modèle (radians), réglée une fois en mode ?debug (Task 6).
export const CALIB = { yaw: 88 * Math.PI / 180, pitch: 6 * Math.PI / 180, roll: -9.5 * Math.PI / 180 };

export function loadGlobe(url, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => { onProgress(1); resolve(buildGlobe(gltf.scene)); },   // les transferts sans Content-Length ne remontent jamais ev.total
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
