export type LoadState =
  'initial' | 'loading' | 'content' | 'empty' | 'error' | 'refreshing' | 'stale';

export function beginLoad(hasSnapshot: boolean): LoadState {
  return hasSnapshot ? 'refreshing' : 'loading';
}

export function completeLoad(itemCount: number): LoadState {
  return itemCount > 0 ? 'content' : 'empty';
}

export function failLoad(hasSnapshot: boolean): LoadState {
  return hasSnapshot ? 'stale' : 'error';
}

export function isInitialLoad(state: LoadState): boolean {
  return state === 'initial' || state === 'loading';
}
