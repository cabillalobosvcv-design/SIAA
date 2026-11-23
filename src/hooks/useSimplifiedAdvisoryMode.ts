import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'siaa_advisory_simplified_mode';
const EVENT_NAME = 'siaa-advisory-view-mode-updated';

function readStoredSimplified(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useSimplifiedAdvisoryMode() {
  const [isSimplified, setIsSimplifiedState] = useState<boolean>(readStoredSimplified);

  useEffect(() => {
    const sync = () => setIsSimplifiedState(readStoredSimplified());
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === STORAGE_KEY) sync();
    };

    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setIsSimplified = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setIsSimplifiedState(prev => {
      const value = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem(STORAGE_KEY, String(value));
      } catch {
        // Ignore storage quota errors
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME));
      }
      return value;
    });
  }, []);

  const toggleSimplified = useCallback(() => {
    setIsSimplified(prev => !prev);
  }, [setIsSimplified]);

  return { isSimplified, setIsSimplified, toggleSimplified };
}
