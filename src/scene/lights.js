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
