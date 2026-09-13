export const WAIT = 'wait';
export const FINAL = 7;
export const LAST_REAL = 6;

export function initialState({ unlocked = false, secretReady = false } = {}) {
  return {
    phase: 'INTRO', stop: 0, visited: [0], unlocked, secretReady, waitReached: false,
    flight: null, lockOpen: false, reentry: false, failures: 0, ticketFlipped: false,
  };
}

const atRest = (s) => s.phase === 'AT_STOP' || s.phase === 'LOCKED' || s.phase === 'REVEALED';
const maxVisited = (v) => Math.max(...v);

export function canNext(s) {
  return s.phase === 'AT_STOP' && s.stop <= LAST_REAL;
}
export function canPrev(s) {
  if (s.lockOpen) return false;
  if (s.phase === 'AT_STOP') return s.stop > 0;
  return s.phase === 'LOCKED' || s.phase === 'REVEALED';
}
export function canGoto(s, j) {
  if (!atRest(s) || s.lockOpen || j === s.stop) return false;
  if (j === FINAL) return s.stop !== WAIT && s.visited.includes(LAST_REAL);
  return s.visited.includes(j) || j === maxVisited(s.visited) + 1;
}

function fly(s, to, backwards) {
  return { ...s, phase: 'FLYING', flight: { from: s.stop, to, backwards }, lockOpen: false };
}

export function reduce(s, action) {
  switch (action.type) {
    case 'START':
      return s.phase === 'INTRO' ? { ...s, phase: 'AT_STOP' } : s;
    case 'SECRET_READY':
      return { ...s, secretReady: true };
    case 'NEXT': {
      if (!canNext(s)) return s;
      if (s.stop < LAST_REAL) return fly(s, s.stop + 1, false);
      return fly(s, s.unlocked ? FINAL : WAIT, false);
    }
    case 'PREV': {
      if (!canPrev(s)) return s;
      if (s.phase === 'AT_STOP') return fly(s, s.stop - 1, true);
      return fly(s, LAST_REAL, true);
    }
    case 'GOTO': {
      const j = action.index;
      if (!canGoto(s, j)) return s;
      if (j === FINAL) {
        const direct = s.unlocked || s.visited.includes(FINAL);
        return fly(s, direct ? FINAL : WAIT, false);
      }
      const backwards = typeof s.stop === 'number' ? j < s.stop : true;
      return fly(s, j, backwards);
    }
    case 'ARRIVED': {
      if (s.phase !== 'FLYING') return s;
      const to = s.flight.to;
      const base = { ...s, flight: null };
      if (to === WAIT) return { ...base, phase: 'LOCKED', stop: WAIT, waitReached: true, reentry: false };
      const visited = base.visited.includes(to) ? base.visited : [...base.visited, to].sort((a, b) => a - b);
      if (to === FINAL) {
        return s.secretReady
          ? { ...base, phase: 'REVEALED', stop: FINAL, visited }
          : { ...base, phase: 'LOCKED', stop: FINAL, visited, reentry: true };
      }
      return { ...base, phase: 'AT_STOP', stop: to, visited };
    }
    case 'OPEN_LOCK':
      return s.phase === 'LOCKED' ? { ...s, lockOpen: true } : s;
    case 'CLOSE_LOCK':
      return s.phase === 'LOCKED' ? { ...s, lockOpen: false } : s;
    case 'CODE_KO':
      return s.phase === 'LOCKED' ? { ...s, failures: s.failures + 1 } : s;
    case 'CODE_OK': {
      if (s.phase !== 'LOCKED') return s;
      const next = { ...s, unlocked: true, secretReady: true, lockOpen: false };
      if (s.reentry) return { ...next, phase: 'REVEALED', stop: FINAL, reentry: false };
      return { ...next, phase: 'UNLOCKING' };
    }
    case 'LANDED': {
      if (s.phase !== 'UNLOCKING') return s;
      const visited = s.visited.includes(FINAL) ? s.visited : [...s.visited, FINAL];
      return { ...s, phase: 'REVEALED', stop: FINAL, visited };
    }
    case 'FLIP_TICKET':
      return s.phase === 'REVEALED' ? { ...s, ticketFlipped: !s.ticketFlipped } : s;
    default:
      return s;
  }
}
