const LS_UNLOCKED = 'nano.unlocked';
const SS_CODE = 'nano.code';
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

export const persist = {
  isUnlocked: () => safe(() => localStorage.getItem(LS_UNLOCKED) === '1', false),
  setUnlocked: () => safe(() => localStorage.setItem(LS_UNLOCKED, '1')),
  getSessionCode: () => safe(() => sessionStorage.getItem(SS_CODE), null),
  setSessionCode: (code) => safe(() => sessionStorage.setItem(SS_CODE, code)),
  reset: () => safe(() => { localStorage.removeItem(LS_UNLOCKED); sessionStorage.removeItem(SS_CODE); }),
};
