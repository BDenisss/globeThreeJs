import { describe, it, expect } from 'vitest';
import { hashCode, encryptSecret, decryptSecret } from '../src/lib/crypto.js';
import { seal, patchContent } from '../scripts/sealLib.mjs';

const CONTENT = { destination: 'QUELQUE PART', dates: 'BIENTÔT', from: 'A', to: 'B', passengers: 'X & Y', message: 'Coucou\nligne 2' };

describe('crypto', () => {
  it('hashCode est déterministe et dépend du sel', async () => {
    const h1 = await hashCode('123456', 'aa');
    expect(h1).toBe(await hashCode('123456', 'aa'));
    expect(h1).toHaveLength(64);
    expect(h1).not.toBe(await hashCode('123456', 'bb'));
    expect(h1).not.toBe(await hashCode('123457', 'aa'));
  });
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
  it('produit sel, hash et secret vérifiés', async () => {
    const { salt, hash, sealed } = await seal('4242', CONTENT);
    expect(salt).toHaveLength(32);
    expect(hash).toBe(await hashCode('4242', salt));
    expect(await decryptSecret('4242', sealed)).toEqual(CONTENT);
  });
  it('patchContent remplace uniquement les deux lignes', () => {
    const src = 'export const a = 1;\nexport const codeSalt = "";\nexport const codeHash = "old";\n';
    const out = patchContent(src, 'S', 'H');
    expect(out).toBe('export const a = 1;\nexport const codeSalt = "S";\nexport const codeHash = "H";\n');
    expect(() => patchContent('rien', 'S', 'H')).toThrow(/codeSalt/);
  });
});
