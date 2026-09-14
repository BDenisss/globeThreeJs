import { describe, it, expect } from 'vitest';
import { initialState, reduce, canNext, canPrev, canGoto, WAIT, FINAL } from '../src/state.js';
import { createStore } from '../src/app/store.js';

const run = (s, ...actions) => actions.reduce((st, a) => reduce(st, typeof a === 'string' ? { type: a } : a), s);
const NEXT = 'NEXT', PREV = 'PREV', ARRIVED = 'ARRIVED';

describe('parcours nominal', () => {
  it('INTRO → START → AT_STOP(0)', () => {
    const s = run(initialState(), 'START');
    expect(s.phase).toBe('AT_STOP'); expect(s.stop).toBe(0); expect(s.visited).toEqual([0]);
  });
  it('NEXT enchaîne les 7 étapes puis mène au point d attente (LOCKED)', () => {
    let s = run(initialState(), 'START');
    for (let i = 1; i <= 6; i++) {
      s = run(s, NEXT);
      expect(s.phase).toBe('FLYING'); expect(s.flight).toEqual({ from: i - 1, to: i, backwards: false });
      s = run(s, ARRIVED);
      expect(s.phase).toBe('AT_STOP'); expect(s.stop).toBe(i);
    }
    expect(s.visited).toEqual([0, 1, 2, 3, 4, 5, 6]);
    s = run(s, NEXT);
    expect(s.flight).toEqual({ from: 6, to: WAIT, backwards: false });
    s = run(s, ARRIVED);
    expect(s.phase).toBe('LOCKED'); expect(s.stop).toBe(WAIT); expect(s.waitReached).toBe(true); expect(s.reentry).toBe(false);
  });
  it('les commandes sont ignorées pendant un vol', () => {
    const s = run(initialState(), 'START', NEXT);
    expect(run(s, NEXT)).toBe(s); expect(run(s, PREV)).toBe(s); expect(run(s, { type: 'GOTO', index: 0 })).toBe(s);
  });
  it('PREV vole en arrière sur le même arc', () => {
    const s = run(initialState(), 'START', NEXT, ARRIVED, PREV);
    expect(s.flight).toEqual({ from: 1, to: 0, backwards: true });
    expect(run(s, ARRIVED).visited).toEqual([0, 1]);
  });
  it('PREV est ignoré à Paris, NEXT ignoré en INTRO', () => {
    const s0 = initialState();
    expect(run(s0, NEXT)).toBe(s0);
    const s = run(s0, 'START');
    expect(run(s, PREV)).toBe(s);
  });
});

describe('GOTO', () => {
  const atStop2 = run(initialState(), 'START', NEXT, ARRIVED, NEXT, ARRIVED);
  it('refuse une étape non visitée autre que la suivante', () => {
    expect(canGoto(atStop2, 5)).toBe(false);
    expect(run(atStop2, { type: 'GOTO', index: 5 })).toBe(atStop2);
  });
  it('accepte une étape visitée (en arrière) et la suivante (en avant)', () => {
    expect(run(atStop2, { type: 'GOTO', index: 0 }).flight).toEqual({ from: 2, to: 0, backwards: true });
    expect(run(atStop2, { type: 'GOTO', index: 3 }).flight).toEqual({ from: 2, to: 3, backwards: false });
  });
  it('GOTO(7) sans déverrouillage mène au point d attente seulement depuis Barcelone visitée', () => {
    expect(canGoto(atStop2, FINAL)).toBe(false);
    let s = atStop2; for (let i = 3; i <= 6; i++) s = run(s, NEXT, ARRIVED);
    expect(run(s, { type: 'GOTO', index: FINAL }).flight).toEqual({ from: 6, to: WAIT, backwards: false });
    const atWait = run(s, { type: 'GOTO', index: FINAL }, ARRIVED);
    expect(canGoto(atWait, FINAL)).toBe(false);   // déjà au point d attente
  });
});

describe('verrou et révélation', () => {
  let locked = run(initialState(), 'START');
  for (let i = 0; i < 7; i++) locked = run(locked, NEXT, ARRIVED);
  it('OPEN_LOCK / CLOSE_LOCK / CODE_KO', () => {
    let s = run(locked, 'OPEN_LOCK'); expect(s.lockOpen).toBe(true);
    s = run(s, 'CODE_KO'); expect(s.failures).toBe(1); expect(s.phase).toBe('LOCKED');
    s = run(s, 'CLOSE_LOCK'); expect(s.lockOpen).toBe(false);
  });
  it('les swipes sont ignorés tant que le pavé est ouvert', () => {
    const s = run(locked, 'OPEN_LOCK');
    expect(run(s, PREV)).toBe(s);
  });
  it('PREV depuis LOCKED ramène à Barcelone', () => {
    expect(run(locked, PREV).flight).toEqual({ from: WAIT, to: 6, backwards: true });
  });
  it('CODE_OK → UNLOCKING → LANDED → REVEALED, étape 7 visitée', () => {
    let s = run(locked, 'OPEN_LOCK', 'CODE_OK');
    expect(s.phase).toBe('UNLOCKING'); expect(s.unlocked).toBe(true); expect(s.secretReady).toBe(true); expect(s.lockOpen).toBe(false);
    s = run(s, 'LANDED');
    expect(s.phase).toBe('REVEALED'); expect(s.stop).toBe(FINAL); expect(s.visited).toContain(FINAL);
    expect(run(s, NEXT)).toBe(s);
    expect(run(s, 'FLIP_TICKET').ticketFlipped).toBe(true);
    expect(run(s, PREV).flight).toEqual({ from: FINAL, to: 6, backwards: true });
  });
  it('déjà déverrouillé + secret prêt : Barcelone → Londres direct → REVEALED', () => {
    let s = run(initialState({ unlocked: true, secretReady: true }), 'START');
    for (let i = 0; i < 6; i++) s = run(s, NEXT, ARRIVED);
    s = run(s, NEXT); expect(s.flight).toEqual({ from: 6, to: FINAL, backwards: false });
    s = run(s, ARRIVED); expect(s.phase).toBe('REVEALED'); expect(s.waitReached).toBe(false);
  });
  it('déjà déverrouillé sans secret : arrivée à Londres = LOCKED(reentry), CODE_OK → REVEALED sans vol', () => {
    let s = run(initialState({ unlocked: true, secretReady: false }), 'START');
    for (let i = 0; i < 7; i++) s = run(s, NEXT, ARRIVED);
    expect(s.phase).toBe('LOCKED'); expect(s.reentry).toBe(true); expect(s.stop).toBe(FINAL);
    s = run(s, 'OPEN_LOCK', 'CODE_OK');
    expect(s.phase).toBe('REVEALED'); expect(s.reentry).toBe(false);
  });
});

describe('prédicats', () => {
  it('canNext / canPrev', () => {
    const s = run(initialState(), 'START');
    expect(canNext(s)).toBe(true); expect(canPrev(s)).toBe(false);
    const f = run(s, NEXT); expect(canNext(f)).toBe(false);
  });
});

describe('store', () => {
  it('dispatch notifie les abonnés seulement si l état change', () => {
    const store = createStore(initialState(), reduce);
    const calls = [];
    store.subscribe((s, prev, a) => calls.push([a.type, prev.phase, s.phase]));
    store.dispatch({ type: 'NEXT' });   // ignoré en INTRO
    store.dispatch({ type: 'START' });
    expect(calls).toEqual([['START', 'INTRO', 'AT_STOP']]);
    expect(store.get().phase).toBe('AT_STOP');
  });
});
