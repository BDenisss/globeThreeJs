import { describe, it, expect } from 'vitest';
import { planePose, restPose } from '../src/scene/planePose.js';
import { latLonToVec3, length, sub, dot, normalize } from '../src/lib/geo.js';

const a = latLonToVec3(48.86, 2.35), b = latLonToVec3(35.68, 139.65);

describe('planePose', () => {
  it('position à base+lift au milieu, cible devant, up radial', () => {
    const p = planePose(a, b, 0.5, 0.2);
    expect(Math.abs(length(p.position) - 1.33)).toBeLessThan(1e-6);
    expect(Math.abs(length(p.up) - 1)).toBeLessThan(1e-6);
    expect(dot(normalize(p.position), p.up)).toBeGreaterThan(0.999);
    const ahead = sub(p.target, p.position);
    expect(length(ahead)).toBeGreaterThan(0);
    expect(dot(normalize(ahead), normalize(sub(b, a)))).toBeGreaterThan(0);   // va vers b
  });
  it('à e=1 la cible reste devant (pas de dégénérescence)', () => {
    const p = planePose(a, b, 1, 0.2);
    expect(length(sub(p.target, p.position))).toBeGreaterThan(0);
    expect(Math.abs(length(p.position) - 1.13)).toBeLessThan(1e-6);
  });
  it('roll nul aux extrémités, max au milieu', () => {
    expect(planePose(a, b, 0, 0.2).roll).toBeCloseTo(0, 6);
    expect(planePose(a, b, 0.5, 0.2).roll).toBeCloseTo(15 * Math.PI / 180, 6);
  });
  it('échelle : 5 % au décollage, 100 % dès 20 % du vol et au repos', () => {
    expect(planePose(a, b, 0, 0.2).scale).toBeCloseTo(0.05, 6);
    expect(planePose(a, b, 0.1, 0.2).scale).toBeGreaterThan(0.05);
    expect(planePose(a, b, 0.1, 0.2).scale).toBeLessThan(1);
    expect(planePose(a, b, 0.2, 0.2).scale).toBeCloseTo(1, 6);
    expect(planePose(a, b, 0.7, 0.2).scale).toBe(1);
    expect(restPose(a, b).scale).toBe(1);
  });
  it('restPose pose à l altitude demandée, orienté vers la prochaine étape', () => {
    const r = restPose(a, b, 1.13);
    expect(Math.abs(length(r.position) - 1.13)).toBeLessThan(1e-6);
    expect(dot(normalize(sub(r.target, r.position)), normalize(sub(b, a)))).toBeGreaterThan(0);
  });
});
