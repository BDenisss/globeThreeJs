import { planePose } from '../scene/planePose.js';

// Séquence de révélation : le « ? » se dissout, l'avion vole vers la destination, éclat, puis onLanded.
export function runUnlockSequence({ qmark, lockCard, flights, plane, rig, trail, toWorldDir, waitVec, finalVec, liftOf, onProgress, onArrive, onLanded, reducedMotion }) {
  qmark.fadeOut(0.6);
  lockCard.hide();
  const lift = liftOf(waitVec, finalVec);
  setTimeout(() => {
    flights.start({
      from: waitVec, to: finalVec, durationScale: reducedMotion ? 0.5 : 1,
      onProgress(e) {
        onProgress(e);
        const p = planePose(waitVec, finalVec, e, lift);
        plane.setPose(p);
        rig.setDirection(toWorldDir(p.position));
        rig.setZoomOut(reducedMotion ? 0 : Math.sin(Math.PI * e));
        if (!reducedMotion && trail) trail.push(p.position, p.scale);
      },
      onDone() { onProgress(1); rig.setZoomOut(0); onArrive(); setTimeout(onLanded, 500); },   // 1 : le segment reste tracé jusqu à LANDED
    });
  }, 400);
}
