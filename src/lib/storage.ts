/**
 * Browser-local persistence.
 *
 * Everything the operator enters stays on this machine. Nothing is uploaded and
 * no server exists in this phase. Reads never throw: a missing, corrupt or
 * outdated payload silently falls back to the caller's default, so a bad write
 * can never leave the app unusable.
 */

const NAMESPACE = 'butcher-protocol';
export const STORAGE_VERSION = 1;

export interface StoredPayload<T> {
  version: number;
  data: T;
}

function storageKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

export function isStorageAvailable(): boolean {
  try {
    const probe = storageKey('__probe');
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredPayload<T>;
    if (parsed.version !== STORAGE_VERSION) return fallback;
    return parsed.data;
  } catch {
    return fallback;
  }
}

export type WriteOutcome = 'ok' | 'unavailable' | 'failed';

export function writeStored<T>(key: string, data: T): WriteOutcome {
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify({ version: STORAGE_VERSION, data }));
    return 'ok';
  } catch (error) {
    const quotaExceeded =
      error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return quotaExceeded ? 'failed' : 'unavailable';
  }
}

export function clearStored(key: string): void {
  try {
    window.localStorage.removeItem(storageKey(key));
  } catch {
    /* Nothing to do — persistence is best-effort. */
  }
}

/** Stable id for locally created records. */
export function createLocalId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}