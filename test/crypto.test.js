import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../src/lib/crypto.js';
import { seal } from '../scripts/sealLib.mjs';

const CONTENT = { destination: 'QUELQUE PART', dates: 'BIENTÔT', from: 'A', to: 'B', passengers: 'X & Y', message: 'Coucou\nligne 2' };

describe('crypto', () => {
  it('encryptSecret / decryptSecret font l aller-retour', async () => {
    const sealed = await encryptSecret('123456', CONTENT);
    expect(sealed.v).toBe(1);
    expect(JSON.stringify(sealed)).not.toContain('QUELQUE');
    expect(await decryptSecret('123456', sealed)).toEqual(CONTENT);
  });
  it('un mauvais code est rejeté proprement', async () => {
    const sealed = await encryptSecret('123456', CONTENT);
    await expect(decryptSecret('000000', sealed)).rejects.toBeTruthy();
    await expect(decryptSecret('123456', { v: 2 })).rejects.toThrow(/format/);
  });
});

describe('seal', () => {
  it('produit un secret vérifié', async () => {
    const { sealed } = await seal('4242', CONTENT);
    expect(sealed.v).toBe(1);
    expect(await decryptSecret('4242', sealed)).toEqual(CONTENT);
  });
});
