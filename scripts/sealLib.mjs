import { randomBytes, bytesToHex, hashCode, encryptSecret, decryptSecret } from '../src/lib/crypto.js';

export async function seal(code, content) {
  const salt = bytesToHex(randomBytes(16));
  const hash = await hashCode(code, salt);
  const sealed = await encryptSecret(code, content);
  const back = await decryptSecret(code, sealed);
  if (JSON.stringify(back) !== JSON.stringify(content)) throw new Error('vérification du déchiffrement échouée');
  return { salt, hash, sealed };
}

export function patchContent(source, salt, hash) {
  const rSalt = /export const codeSalt = "[^"]*";/;
  const rHash = /export const codeHash = "[^"]*";/;
  if (!rSalt.test(source) || !rHash.test(source)) throw new Error('content.js : lignes codeSalt/codeHash introuvables');
  return source.replace(rSalt, `export const codeSalt = "${salt}";`).replace(rHash, `export const codeHash = "${hash}";`);
}
