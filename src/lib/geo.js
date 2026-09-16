// Repère géographique : Y = pôle Nord, +Z = méridien de Greenwich, +X = 90° Est.
export const DEG = Math.PI / 180;

export function latLonToVec3(lat, lon, r = 1) {
  const la = lat * DEG, lo = lon * DEG;
  return { x: r * Math.cos(la) * Math.sin(lo), y: r * Math.sin(la), z: r * Math.cos(la) * Math.cos(lo) };
}
export function toLatLon(v) {
  const u = normalize(v);
  return { lat: Math.asin(u.y) / DEG, lon: Math.atan2(u.x, u.z) / DEG };
}
export const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const length = (v) => Math.sqrt(dot(v, v));
export const scale = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export function normalize(v) {
  const l = length(v);
  return l === 0 ? { x: 0, y: 0, z: 0 } : scale(v, 1 / l);
}
export function angleBetween(a, b) {
  return Math.acos(Math.min(1, Math.max(-1, dot(normalize(a), normalize(b)))));
}
// Interpolation sphérique entre deux directions (arc de grand cercle).
export function slerp(a, b, t) {
  const ua = normalize(a), ub = normalize(b);
  const om = angleBetween(ua, ub);
  const so = Math.sin(om);
  if (so < 1e-6) return normalize(add(scale(ua, 1 - t), scale(ub, t)));
  return add(scale(ua, Math.sin((1 - t) * om) / so), scale(ub, Math.sin(t * om) / so));
}
// Bombement de l'arc selon sa longueur (rad), léger et plafonné (≈ 0,10 pour Paris → KL).
export const liftFor = (angle) => Math.min(0.15, 0.04 + 0.13 * angle / Math.PI);
// Point de l'arc à t ∈ [0,1], altitude base + lift·sin(πt).
export function arcPoint(a, b, t, lift, base = 1) {
  return scale(slerp(a, b, t), base + lift * Math.sin(Math.PI * t));
}
// Durée d'un vol (s) : 2 s + 5,9 s·angle/π → Paris → Barcelone ≈ 2,3 s, Paris → KL ≈ 5 s ; retour en arrière × 0,7.
export function flightDuration(angle, backwards = false) {
  return (2.0 + 5.9 * angle / Math.PI) * (backwards ? 0.7 : 1);
}
