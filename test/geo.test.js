import { describe, it, expect } from 'vitest';
import {
  latLonToVec3, toLatLon, slerp, arcPoint, angleBetween, liftFor, flightDuration, length,
} from '../src/lib/geo.js';
import { easeInOutCubic, clamp01 } from '../src/lib/ease.js';

const PARIS = { lat: 48.8566, lon: 2.3522 };
const TOKYO = { lat: 35.6762, lon: 139.6503 };
const LONDON = { lat: 51.5074, lon: -0.1278 };
const KL = { lat: 3.139, lon: 101.6869 };
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

describe('latLonToVec3', () => {
  it('renvoie un vecteur unitaire', () => {
    expect(near(length(latLonToVec3(PARIS.lat, PARIS.lon)), 1)).toBe(true);
  });
  it('pôle Nord sur +Y, méridien 0 sur +Z, est sur +X', () => {
    const n = latLonToVec3(90, 0); expect(near(n.y, 1)).toBe(true);
    const z = latLonToVec3(0, 0); expect(near(z.z, 1)).toBe(true);
    const x = latLonToVec3(0, 90); expect(near(x.x, 1)).toBe(true);
  });
  it('Paris/Londres/KL ont les signes attendus', () => {
    const p = latLonToVec3(PARIS.lat, PARIS.lon);
    expect(p.y).toBeGreaterThan(0.7); expect(p.z).toBeGreaterThan(0); expect(p.x).toBeGreaterThan(0);
    expect(latLonToVec3(LONDON.lat, LONDON.lon).x).toBeLessThan(0);
    const k = latLonToVec3(KL.lat, KL.lon);
    expect(k.x).toBeGreaterThan(0.9); expect(Math.abs(k.y)).toBeLessThan(0.1);
  });
  it('toLatLon inverse latLonToVec3', () => {
    const ll = toLatLon(latLonToVec3(TOKYO.lat, TOKYO.lon));
    expect(near(ll.lat, TOKYO.lat, 1e-9)).toBe(true);
    expect(near(ll.lon, TOKYO.lon, 1e-9)).toBe(true);
  });
});

describe('slerp / arcPoint', () => {
  const a = latLonToVec3(PARIS.lat, PARIS.lon);
  const b = latLonToVec3(TOKYO.lat, TOKYO.lon);
  it('extrémités', () => {
    const s0 = slerp(a, b, 0), s1 = slerp(a, b, 1);
    expect(near(s0.x, a.x)).toBe(true); expect(near(s1.z, b.z)).toBe(true);
  });
  it('le milieu Paris → Tokyo passe au nord de 55°', () => {
    expect(toLatLon(slerp(a, b, 0.5)).lat).toBeGreaterThan(55);
  });
  it('arcPoint monte à base + lift au milieu et reste à base aux extrémités', () => {
    expect(near(length(arcPoint(a, b, 0.5, 0.2)), 1.2)).toBe(true);
    expect(near(length(arcPoint(a, b, 0, 0.2)), 1)).toBe(true);
    expect(near(length(arcPoint(a, b, 1, 0.2, 1.07)), 1.07)).toBe(true);
  });
  it('angleBetween Paris → Tokyo ≈ 1.52 rad', () => {
    expect(Math.abs(angleBetween(a, b) - 1.52)).toBeLessThan(0.02);
  });
});

describe('durées et altitude', () => {
  it('liftFor croît avec l angle et plafonne à 0.35', () => {
    expect(near(liftFor(0), 0.08)).toBe(true);
    expect(near(liftFor(Math.PI), 0.35)).toBe(true);
    expect(liftFor(Math.PI / 2)).toBeGreaterThan(0.2);
  });
  it('flightDuration : 1.2 s + 2.6 s·angle/π, ×0.6 en arrière', () => {
    expect(near(flightDuration(Math.PI / 2), 2.5)).toBe(true);
    expect(near(flightDuration(Math.PI / 2, true), 1.5)).toBe(true);
  });
  it('easeInOutCubic symétrique, clamp01 borne', () => {
    expect(near(easeInOutCubic(0.5), 0.5)).toBe(true);
    expect(easeInOutCubic(0)).toBe(0); expect(easeInOutCubic(1)).toBe(1);
    expect(clamp01(-2)).toBe(0); expect(clamp01(9)).toBe(1);
  });
});
