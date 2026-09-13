import { describe, it, expect } from 'vitest';
import { createFlightRunner } from '../src/app/flight.js';
import { latLonToVec3 } from '../src/lib/geo.js';

describe('flight runner', () => {
  it('progresse de 0 à 1, appelle onDone une seule fois', () => {
    const r = createFlightRunner();
    const seen = []; let done = 0;
    r.start({ from: latLonToVec3(48.86, 2.35), to: latLonToVec3(3.14, 101.69), onProgress: (e) => seen.push(e), onDone: () => done++ });
    expect(r.active()).toBe(true);
    for (let i = 0; i < 100; i++) r.update(0.05);   // 5 s > durée (≈2.5 s)
    expect(done).toBe(1);
    expect(r.active()).toBe(false);
    expect(seen[0]).toBeGreaterThanOrEqual(0);
    expect(seen[seen.length - 1]).toBe(1);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).toBeGreaterThanOrEqual(seen[i - 1]);
  });
  it('durationScale raccourcit le vol', () => {
    const r = createFlightRunner();
    let done = 0;
    r.start({ from: latLonToVec3(0, 0), to: latLonToVec3(0, 90), durationScale: 0.1, onProgress() {}, onDone: () => done++ });
    for (let i = 0; i < 10; i++) r.update(0.05);   // 0.5 s
    expect(done).toBe(1);
  });
});
