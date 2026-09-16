import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const PLANE_SIZE = 0.12;   // plus grande dimension du modèle (≈ envergure pour un avion de ligne)
// Rotation Y (rad) à appliquer au glb pour que son nez pointe vers +Z (à ajuster à l'œil si besoin).
const GLB_YAW = 0;

export function buildProceduralPlane() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9b65c, roughness: 0.5, metalness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
  const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.09, 4, 8), gold);
  fuselage.rotation.x = Math.PI / 2; g.add(fuselage);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(PLANE_SIZE, 0.004, 0.022), gold); wing.position.z = -0.005; g.add(wing);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.003, 0.014), gold); tail.position.z = -0.05; g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.022, 0.016), dark); fin.position.set(0, 0.012, -0.05); g.add(fin);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), dark); nose.position.z = 0.056; g.add(nose);
  return g;
}

function normalizeGlb(sceneObj) {
  // Les matériaux métalliques (exports Sketchfab) rendent noirs sans carte d'environnement : on les rend mats.
  sceneObj.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) { if ('metalness' in m) { m.metalness = 0; m.roughness = Math.max(m.roughness ?? 0.5, 0.5); m.needsUpdate = true; } }
  });
  const box = new THREE.Box3().setFromObject(sceneObj);
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const inner = new THREE.Group();
  sceneObj.position.sub(center);
  inner.add(sceneObj);
  inner.scale.setScalar(PLANE_SIZE / Math.max(size.x, size.y, size.z));
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
  const restDir = new THREE.Vector3(0, 0, 1);
  let restLen = 1.13;
  return {
    object,
    setPose({ position, target: t, up, roll, scale = 1 }) {
      object.position.set(position.x, position.y, position.z);
      object.scale.setScalar(scale);
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
