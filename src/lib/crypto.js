// Fonctionne dans le navigateur et dans Node ≥ 20 (globalThis.crypto).
const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
const KDF_ITERATIONS = 200000;

export function randomBytes(n) {
  const b = new Uint8Array(n);
  globalThis.crypto.getRandomValues(b);
  return b;
}
export const bytesToHex = (b) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
export const bytesToB64 = (b) => btoa(String.fromCharCode(...b));
export const b64ToBytes = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function sha256Hex(text) {
  const d = await subtle.digest('SHA-256', enc.encode(text));
  return bytesToHex(new Uint8Array(d));
}
export const hashCode = (code, saltHex) => sha256Hex(saltHex + code);

async function deriveKey(code, saltBytes) {
  const base = await subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations: KDF_ITERATIONS, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}
export async function encryptSecret(code, obj) {
  const kdfSalt = randomBytes(16), iv = randomBytes(12);
  const key = await deriveKey(code, kdfSalt);
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  return { v: 1, kdfSalt: bytesToB64(kdfSalt), iv: bytesToB64(iv), ciphertext: bytesToB64(new Uint8Array(ct)) };
}
export async function decryptSecret(code, sealed) {
  if (!sealed || sealed.v !== 1) throw new Error('format de secret inconnu');
  const key = await deriveKey(code, b64ToBytes(sealed.kdfSalt));
  const pt = await subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(sealed.iv) }, key, b64ToBytes(sealed.ciphertext));
  return JSON.parse(dec.decode(pt));
}
