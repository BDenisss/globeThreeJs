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
