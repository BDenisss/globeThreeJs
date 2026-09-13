import { angleBetween, liftFor, flightDuration, arcPoint } from '../lib/geo.js';
import { easeInOutCubic, clamp01 } from '../lib/ease.js';

export function createFlightRunner() {
  let cur = null;
  return {
    start({ from, to, backwards = false, durationScale = 1, onProgress, onDone }) {
      const angle = angleBetween(from, to);
      cur = { from, to, lift: liftFor(angle), duration: flightDuration(angle, backwards) * durationScale, elapsed: 0, onProgress, onDone };
    },
    active: () => cur !== null,
    update(dt) {
      if (!cur) return;
      cur.elapsed += dt;
      const t = clamp01(cur.elapsed / cur.duration);
      const e = easeInOutCubic(t);
      cur.onProgress(e, arcPoint(cur.from, cur.to, e, cur.lift), cur);
      if (t >= 1) { const f = cur; cur = null; f.onDone(); }
    },
  };
}
