import { WAIT, FINAL, LAST_REAL } from '../state.js';

export const SEGMENT_KEYS = ['0', '1', '2', '3', '4', '5', '6w', 'w7', '67'];

// Progression d'affichage d'un segment (0 = absent, 1 = complet) selon l'état.
export function segmentProgress(s, key, flightProgress) {
  const flight = s.phase === 'FLYING' ? s.flight : s.phase === 'UNLOCKING' ? { from: WAIT, to: FINAL } : null;
  const flying = (from, to) => !!flight && flight.from === from && flight.to === to;
  const v = s.visited;
  if (/^\d$/.test(key)) {
    const i = Number(key);
    if (v.includes(i + 1)) return 1;
    return flying(i, i + 1) ? flightProgress : 0;
  }
  if (key === '6w') {
    if (s.waitReached) return 1;
    return flying(LAST_REAL, WAIT) ? flightProgress : 0;
  }
  if (key === 'w7') {
    if (!s.waitReached) return 0;
    if (v.includes(FINAL)) return 1;
    return flying(WAIT, FINAL) ? flightProgress : 0;
  }
  if (key === '67') {
    if (s.waitReached) return 0;
    if (v.includes(FINAL)) return 1;
    return flying(LAST_REAL, FINAL) ? flightProgress : 0;
  }
  return 0;
}
