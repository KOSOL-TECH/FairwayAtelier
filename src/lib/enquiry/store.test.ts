import { describe, expect, it } from 'vitest';
import { retentionCutoff } from './store';

describe('retentionCutoff', () => {
  it('is three years before now', () => {
    expect(retentionCutoff(new Date('2026-11-03T12:00:00Z'))).toBe('2023-11-03T12:00:00.000Z');
  });

  it('handles 29 February', () => {
    expect(retentionCutoff(new Date('2028-02-29T00:00:00Z'))).toBe('2025-03-01T00:00:00.000Z');
  });
});
