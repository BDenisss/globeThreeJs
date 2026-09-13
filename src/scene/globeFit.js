// Estime le centre et le rayon « niveau de la mer » d'un globe low-poly dont les continents sont extrudés.
export function percentile(values, p) {
  const s = [...values].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))));
  return s[i];
}

function distances(positions, c) {
  const out = new Array(positions.length / 3);
  for (let i = 0; i < positions.length; i += 3) {
    const dx = positions[i] - c.x, dy = positions[i + 1] - c.y, dz = positions[i + 2] - c.z;
    out[i / 3] = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  return out;
}

// Résout A·x = b (4×4) par élimination de Gauss avec pivot partiel.
function solve4(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < 4; c++) {
    let p = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 4; r++) {
      if (r === c || M[c][c] === 0) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[4] / row[i]);
}

// Ajustement algébrique de sphère (Kåsa) : x²+y²+z² = 2ax + 2by + 2cz + k, moindres carrés.
// Insensible à la répartition des points tant qu'ils sont sur la sphère (pas de biais d'hémisphère).
export function kasaFit(positions, indices = null) {
  const A = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]], b = [0, 0, 0, 0];
  const n = indices ? indices.length : positions.length / 3;
  for (let j = 0; j < n; j++) {
    const i = indices ? indices[j] : j;
    const x = positions[3 * i], y = positions[3 * i + 1], z = positions[3 * i + 2];
    const row = [2 * x, 2 * y, 2 * z, 1], rhs = x * x + y * y + z * z;
    for (let r = 0; r < 4; r++) { for (let c = 0; c < 4; c++) A[r][c] += row[r] * row[c]; b[r] += row[r] * rhs; }
  }
  const [a, bb, c, k] = solve4(A, b);
  return { center: { x: a, y: bb, z: c }, radius: Math.sqrt(Math.max(0, k + a * a + bb * bb + c * c)) };
}

export function fitSphere(positions) {
  // Passe 1 : sphère sur tous les sommets (légèrement biaisée par les continents extrudés).
  let { center } = kasaFit(positions);
  // Passes 2-4 : on ne garde que la bande « mer » (5e percentile × 1,03) et on réajuste.
  for (let iter = 0; iter < 3; iter++) {
    const d = distances(positions, center);
    const sea = percentile(d, 0.05);
    const keep = [];
    for (let i = 0; i < d.length; i++) if (d[i] <= sea * 1.03) keep.push(i);
    if (keep.length < 10) break;
    center = kasaFit(positions, keep).center;
  }
  const d = distances(positions, center);
  return { center, seaRadius: percentile(d, 0.05), maxRadius: percentile(d, 1) };
}
