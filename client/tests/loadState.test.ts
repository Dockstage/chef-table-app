import { describe, expect, it } from 'vitest';

import {
  beginLoad,
  completeLoad,
  failLoad,
  isInitialLoad,
} from '../src/shared/loadState';

describe('load state machine', () => {
  it('distinguishes initial loading from refresh over a snapshot', () => {
    expect(beginLoad(false)).toBe('loading');
    expect(beginLoad(true)).toBe('refreshing');
    expect(isInitialLoad('initial')).toBe(true);
    expect(isInitialLoad('loading')).toBe(true);
    expect(isInitialLoad('refreshing')).toBe(false);
  });

  it('distinguishes valid empty data from content', () => {
    expect(completeLoad(0)).toBe('empty');
    expect(completeLoad(1)).toBe('content');
  });

  it('keeps a snapshot stale instead of replacing it with an error', () => {
    expect(failLoad(false)).toBe('error');
    expect(failLoad(true)).toBe('stale');
  });
});
