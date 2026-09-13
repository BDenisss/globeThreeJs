import { describe, it, expect } from 'vitest';
import { segmentProgress, SEGMENT_KEYS } from '../src/scene/routeLogic.js';
import { initialState, reduce, FINAL } from '../src/state.js';

const run = (s, ...a) => a.reduce((st, x) => reduce(st, typeof x === 'string' ? { type: x } : x), s);
const all = (s, p) => Object.fromEntries(SEGMENT_KEYS.map((k) => [k, segmentProgress(s, k, p)]));

describe('segmentProgress', () => {
  it('rien au départ', () => {
    const s = run(initialState(), 'START');
    expect(Object.values(all(s, 0)).every((v) => v === 0)).toBe(true);
  });
  it('le segment en vol suit la progression, les visités restent à 1', () => {
    let s = run(initialState(), 'START', 'NEXT', 'ARRIVED', 'NEXT');
    expect(segmentProgress(s, '0', 0.3)).toBe(1);
    expect(segmentProgress(s, '1', 0.3)).toBe(0.3);
    expect(segmentProgress(s, '2', 0.3)).toBe(0);
    s = run(s, 'ARRIVED', 'PREV');   // 2 → 1 en arrière : rien ne s efface
    expect(segmentProgress(s, '1', 0.5)).toBe(1);
  });
  it('6w pendant le vol vers l attente, puis w7 pendant UNLOCKING', () => {
    let s = run(initialState(), 'START');
    for (let i = 0; i < 6; i++) s = run(s, 'NEXT', 'ARRIVED');
    s = run(s, 'NEXT');
    expect(segmentProgress(s, '6w', 0.4)).toBe(0.4);
    expect(segmentProgress(s, '67', 0.4)).toBe(0);
    s = run(s, 'ARRIVED', 'OPEN_LOCK', 'CODE_OK');
    expect(s.phase).toBe('UNLOCKING');
    expect(segmentProgress(s, '6w', 0)).toBe(1);
    expect(segmentProgress(s, 'w7', 0.7)).toBe(0.7);
    s = run(s, 'LANDED');
    expect(segmentProgress(s, 'w7', 0)).toBe(1);
  });
  it('67 direct quand déjà déverrouillé', () => {
    let s = run(initialState({ unlocked: true, secretReady: true }), 'START');
    for (let i = 0; i < 6; i++) s = run(s, 'NEXT', 'ARRIVED');
    s = run(s, 'NEXT');
    expect(s.flight.to).toBe(FINAL);
    expect(segmentProgress(s, '67', 0.2)).toBe(0.2);
    expect(segmentProgress(s, '6w', 0.2)).toBe(0);
    expect(segmentProgress(run(s, 'ARRIVED'), '67', 0)).toBe(1);
  });
});
