import * as THREE from 'three';

// Traînée dorée derrière l'avion : les dernières positions, fondues vers le noir (mélange additif)
// → ligne continue + points brillants. Tampon fixe, aucune allocation par image.
export function createTrail({ max = 90, life = 0.8, color = 0xd9b65c, size = 0.022 } = {}) {
  const positions = new Float32Array(max * 3);
  const colors = new Float32Array(max * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setDrawRange(0, 0);
  const common = { vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial(common));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ ...common, size, sizeAttenuation: true }));
  // Géométrie dynamique : pas de frustum culling (la sphère englobante serait figée vide au 1er rendu).
  line.frustumCulled = false;
  points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(line, points);
  group.visible = false;
  const gold = new THREE.Color(color);
  const samples = [];   // { x, y, z, t } du plus ancien au plus récent
  let now = 0;
  return {
    object: group,
    // À appeler à chaque image de vol avec la position (locale au globe) de l'avion ;
    // `intensity` (0..1, ex. l'échelle de l'avion) module la brillance de l'échantillon.
    push(p, intensity = 1) {
      samples.push({ x: p.x, y: p.y, z: p.z, t: now, i: intensity });
      if (samples.length > max) samples.shift();
    },
    update(dt) {
      now += dt;
      while (samples.length && now - samples[0].t > life) samples.shift();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const k = 1 - (now - s.t) / life;   // 1 = tout frais, 0 = éteint
        const b = k * k * s.i;
        positions[3 * i] = s.x; positions[3 * i + 1] = s.y; positions[3 * i + 2] = s.z;
        colors[3 * i] = gold.r * b; colors[3 * i + 1] = gold.g * b; colors[3 * i + 2] = gold.b * b;
      }
      geo.setDrawRange(0, samples.length);
      geo.attributes.position.needsUpdate = true;
      geo.attributes.color.needsUpdate = true;
      group.visible = samples.length > 1;
    },
    clear() { samples.length = 0; geo.setDrawRange(0, 0); group.visible = false; },
  };
}
