import * as THREE from 'three';
import { slerp, angleBetween, scale } from '../lib/geo.js';
import { SEGMENT_KEYS, segmentProgress } from './routeLogic.js';

const GOLD = 0xd9b65c;

// Pointillé le long de l'arc a→b (vecteurs unitaires), tirets = petites boîtes instanciées.
export function createDashedArc(a, b, { altitude = 1.10, dash = 0.018, gap = 0.014, thickness = 0.006, color = GOLD } = {}) {
  const arcLen = angleBetween(a, b) * altitude;
  const total = Math.max(1, Math.floor(arcLen / (dash + gap)));
  const geo = new THREE.BoxGeometry(thickness, thickness, dash);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.InstancedMesh(geo, mat, total);
  const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Vector3(), up = new THREE.Vector3();
  for (let i = 0; i < total; i++) {
    const t0 = (i * (dash + gap)) / arcLen, t1 = Math.min(1, t0 + dash / arcLen);
    const pa = scale(slerp(a, b, t0), altitude), pb = scale(slerp(a, b, t1), altitude);
    p.set((pa.x + pb.x) / 2, (pa.y + pb.y) / 2, (pa.z + pb.z) / 2);
    q.set(pb.x, pb.y, pb.z);
    up.copy(p).normalize();
    m.lookAt(p, q, up);
    m.setPosition(p);
    mesh.setMatrixAt(i, m);
  }
  mesh.instanceMatrix.needsUpdate = true;
  // Calculer la sphère englobante pendant que count === total : sinon three.js met en cache une sphère vide au premier rendu et le mesh est éliminé par le frustum culling pour toujours.
  mesh.computeBoundingSphere();
  mesh.count = 0;
  return { mesh, total, setProgress(t) { mesh.count = Math.round(Math.min(1, Math.max(0, t)) * total); } };
}

export function createRoute({ stopsVec, waitVec, finalVec }) {
  const group = new THREE.Group();
  const ends = {
    '6w': [stopsVec[6], waitVec], 'w7': [waitVec, finalVec], '67': [stopsVec[6], finalVec],
  };
  for (let i = 0; i < 6; i++) ends[String(i)] = [stopsVec[i], stopsVec[i + 1]];
  const arcs = {};
  for (const key of SEGMENT_KEYS) {
    arcs[key] = createDashedArc(ends[key][0], ends[key][1]);
    group.add(arcs[key].mesh);
  }
  return {
    group,
    showFor(state, flightProgress = 0) {
      for (const key of SEGMENT_KEYS) arcs[key].setProgress(segmentProgress(state, key, flightProgress));
    },
  };
}
