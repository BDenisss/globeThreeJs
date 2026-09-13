import { encryptSecret, decryptSecret } from '../src/lib/crypto.js';

export async function seal(code, content) {
  const sealed = await encryptSecret(code, content);
  const back = await decryptSecret(code, sealed);
  if (JSON.stringify(back) !== JSON.stringify(content)) throw new Error('vérification du déchiffrement échouée');
  return { sealed };
}
