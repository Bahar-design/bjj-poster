import { describe, it, expect } from 'vitest';
import type { BeltRank } from '../poster-builder-store';

describe('BeltRank type', () => {
  it('accepts all 7 BJJ belt ranks', () => {
    const belts: BeltRank[] = [
      'white',
      'blue',
      'purple',
      'brown',
      'black',
      'red-black',
      'red',
    ];

    expect(belts).toHaveLength(7);
  });
});
