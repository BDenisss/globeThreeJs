import { arcPoint, add, sub, normalize, scale, slerp, length } from '../lib/geo.js';

const BANK_MAX = 15 * Math.PI / 180;
const EPS = 0.01;

// Pose de l'avion en vol : a, b unitaires, e ∈ [0,1] (déjà easé).
export function planePose(a, b, e, lift, base = 1.13) {
  const position = arcPoint(a, b, e, lift, base);
  let dir;
  if (e < 1 - EPS) dir = sub(arcPoint(a, b, e + EPS, lift, base), position);
  else dir = sub(position, arcPoint(a, b, e - EPS, lift, base));
  return { position, target: add(position, normalize(dir)), up: normalize(position), roll: BANK_MAX * Math.sin(Math.PI * e) };
}

// Avion posé en `at`, nez vers `headingTo` (tangent). Si headingTo == at, cap arbitraire (est).
export function restPose(at, headingTo, altitude = 1.13) {
  const position = scale(normalize(at), altitude);
  const next = scale(slerp(at, headingTo, 0.02), altitude);
  let dir = sub(next, position);
  if (length(dir) < 1e-9) dir = { x: -position.z, y: 0, z: position.x };
  return { position, target: add(position, normalize(dir)), up: normalize(position), roll: 0 };
}
