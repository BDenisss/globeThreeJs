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

// Éclat de particules dorées qui montent puis s'éteignent (1,2 s).
export function createBurst(dir, altitude = 1.14, count = 60) {
  const LIFE = 1.2;
  const pos = new Float32Array(count * 3), vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[3 * i] = dir.x * altitude; pos[3 * i + 1] = dir.y * altitude; pos[3 * i + 2] = dir.z * altitude;
    const rx = Math.random() - 0.5, ry = Math.random() - 0.5, rz = Math.random() - 0.5;
    const speed = 0.25 + Math.random() * 0.35;
    vel[3 * i] = (dir.x + rx) * speed; vel[3 * i + 1] = (dir.y + ry) * speed; vel[3 * i + 2] = (dir.z + rz) * speed;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xd9b65c, size: 0.02, transparent: true, opacity: 1, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  let life = 0;
  return {
    object: points,
    update(dt) {
      life += dt;
      for (let i = 0; i < count * 3; i++) { pos[i] += vel[i] * dt; vel[i] *= 0.96; }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - life / LIFE);
      return life >= LIFE;
    },
  };
}

// Big Ben stylisé (silhouette dorée) au-dessus de la destination.
export function createDestinationMarker(dir, altitude = 1.16, size = 0.12) {
  const tex = goldCanvas((g, S) => {
    const u = S / 24;
    g.fillRect(9 * u, 7 * u, 6 * u, 15 * u);                        // tour
    g.beginPath(); g.moveTo(8 * u, 7 * u); g.lineTo(12 * u, 2 * u); g.lineTo(16 * u, 7 * u); g.closePath(); g.fill();   // flèche
    g.fillStyle = '#0B1026'; g.beginPath(); g.arc(12 * u, 11 * u, 2.2 * u, 0, Math.PI * 2); g.fill();                  // cadran
    g.fillStyle = '#D9B65C'; g.beginPath(); g.arc(12 * u, 11 * u, 1.4 * u, 0, Math.PI * 2); g.fill();
  });
  const obj = sprite(tex, size);
  obj.position.set(dir.x * altitude, dir.y * altitude, dir.z * altitude);
  obj.visible = false;
  return { object: obj, show() { obj.visible = true; } };
}
