import { decryptSecret } from '../lib/crypto.js';

// Coffre : charge secret.enc une fois ; la seule vérification du code est le succès du déchiffrement.
export function createSecretVault({ url, fetchImpl = (u) => globalThis.fetch(u) }) {
  let sealed = null, plain = null;
  const loading = fetchImpl(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => { sealed = j; })
    .catch(() => { sealed = null; });
  return {
    ready: () => loading,
    get: () => plain,
    async tryCode(code) {
      await loading;
      if (!sealed) return { ok: false, missing: true };
      try {
        plain = await decryptSecret(code, sealed);
        return { ok: true, secret: plain };
      } catch {
        return { ok: false };
      }
    },
  };
}
