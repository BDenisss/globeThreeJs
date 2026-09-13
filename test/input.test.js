import { describe, it, expect } from 'vitest';
import { classifySwipe } from '../src/ui/input.js';

describe('classifySwipe', () => {
  it('gauche rapide = next, droite rapide = prev', () => {
    expect(classifySwipe(-80, 5, 120)).toBe('next');
    expect(classifySwipe(90, -10, 200)).toBe('prev');
  });
  it('trop court, trop lent ou vertical = rien', () => {
    expect(classifySwipe(-20, 0, 100)).toBe(null);
    expect(classifySwipe(-120, 0, 800)).toBe(null);
    expect(classifySwipe(-50, -90, 100)).toBe(null);
  });
});
