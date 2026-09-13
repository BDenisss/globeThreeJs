import { describe, it, expect } from 'vitest';
import { fitSphere, percentile } from '../src/scene/globeFit.js';

function spherePoints(n, r, c, seed = 1) {
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, k = Math.sqrt(1 - u * u);
    out.push(c.x + r * k * Math.cos(th), c.y + r * k * Math.sin(th), c.z + r * u);
  }
  return out;
}

describe('fitSphere', () => {
  it('percentile', () => {
    expect(percentile([5, 1, 3], 0)).toBe(1);
    expect(percentile([5, 1, 3], 1)).toBe(5);
    expect(percentile([5, 1, 3], 0.5)).toBe(3);
  });
  it('retrouve le centre et le rayon de la mer malgré des continents extrudés d un seul côté', () => {
    const c = { x: 1, y: 2, z: 3 };
    const sea = spherePoints(3000, 3, c);
    // « continents » : 600 points à r = 3.15, tous dans l hémisphère +x
    const land = spherePoints(600, 3.15, c, 7).map((v, i) => (i % 3 === 0 ? Math.abs(v - c.x) + c.x : v));
    const { center, seaRadius, maxRadius } = fitSphere([...sea, ...land]);
    expect(Math.abs(center.x - 1)).toBeLessThan(0.02);
    expect(Math.abs(center.y - 2)).toBeLessThan(0.02);
    expect(Math.abs(center.z - 3)).toBeLessThan(0.02);
    expect(Math.abs(seaRadius - 3)).toBeLessThan(0.02);
    expect(maxRadius).toBeGreaterThan(3.1);
  });
});
