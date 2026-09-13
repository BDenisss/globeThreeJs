export function createStore(initial, reducer) {
  let state = initial;
  const subs = new Set();
  return {
    get: () => state,
    dispatch(action) {
      const prev = state;
      state = reducer(state, action);
      if (state !== prev) for (const fn of subs) fn(state, prev, action);
    },
    subscribe(fn) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}
