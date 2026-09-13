import * as THREE from 'three';

function goldCanvas(draw, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#D9B65C'; g.strokeStyle = '#D9B65C';
  g.shadowColor = 'rgba(217,182,92,.65)'; g.shadowBlur = size * 0.08;
  draw(g, size);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function sprite(tex, size) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.setScalar(size);
  return s;
}

// « ? » doré flottant au-dessus du point d'attente ; pulse doucement, peut se dissoudre.
export function createQuestionMark(dir, altitude = 1.30, size = 0.16) {
  const tex = goldCanvas((g, S) => {
    g.font = `bold ${S * 0.8}px Anton, Impact, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('?', S / 2, S * 0.55);
  });
  const obj = sprite(tex, size);
  obj.position.set(dir.x * altitude, dir.y * altitude, dir.z * altitude);
  let fade = null;
  return {
    object: obj,
    update(dt, t) {
      if (fade) {
        fade.t += dt;
        obj.material.opacity = Math.max(0, 1 - fade.t / fade.d);
        if (fade.t >= fade.d) { obj.visible = false; fade = null; }
      } else {
        obj.scale.setScalar(size * (1 + 0.06 * Math.sin(t * 2)));
      }
    },
    fadeOut(seconds) { fade = { t: 0, d: seconds }; },
    hide() { obj.visible = false; },
  };
}
