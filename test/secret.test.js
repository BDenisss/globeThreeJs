import { describe, it, expect } from 'vitest';
import { createSecretVault } from '../src/app/secret.js';
import { seal } from '../scripts/sealLib.mjs';

const CONTENT = { destination: 'X', dates: 'Y', from: 'A', to: 'B', passengers: 'P', message: 'M' };
const fetchOf = (body) => async () => ({ ok: true, json: async () => body });

describe('secret vault', () => {
  it('bon code → secret en mémoire', async () => {
    const { sealed } = await seal('4321', CONTENT);
    const v = createSecretVault({ url: 'x', fetchImpl: fetchOf(sealed) });
    expect(v.get()).toBe(null);
    const r = await v.tryCode('4321');
    expect(r.ok).toBe(true); expect(r.secret).toEqual(CONTENT); expect(v.get()).toEqual(CONTENT);
  });
  it('mauvais code → ok:false, rien en mémoire', async () => {
    const { sealed } = await seal('4321', CONTENT);
    const v = createSecretVault({ url: 'x', fetchImpl: fetchOf(sealed) });
    expect(await v.tryCode('0000')).toEqual({ ok: false });
    expect(v.get()).toBe(null);
  });
  it('fichier absent (404) ou illisible → missing', async () => {
    const v404 = createSecretVault({ url: 'x', fetchImpl: async () => ({ ok: false, json: async () => null }) });
    expect(await v404.tryCode('4321')).toEqual({ ok: false, missing: true });
    const vBad = createSecretVault({ url: 'x', fetchImpl: async () => { throw new Error('réseau'); } });
    expect(await vBad.tryCode('4321')).toEqual({ ok: false, missing: true });
  });
});
