import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

const HYDRATION_TIMEOUT_MS = 400;

export function useStoreHydration(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = () => {
      if (!cancelled) setHydrated(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(finish);

    void Promise.resolve(useAuthStore.persist.rehydrate()).then(finish).catch(finish);

    const timer = setTimeout(finish, HYDRATION_TIMEOUT_MS);

    return () => {
      cancelled = true;
      unsub();
      clearTimeout(timer);
    };
  }, []);

  return hydrated;
}
