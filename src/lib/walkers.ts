import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { api, type MapMarkerDto } from '@/lib/api';

/** People walking a dog who chose to share their area. Reloads every 30 seconds while the screen is open. */
export function useWalkers(): MapMarkerDto[] {
  const [walkers, setWalkers] = useState<MapMarkerDto[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = () =>
        api
          .mapMarkers()
          .then((m) => active && setWalkers(m))
          .catch(() => undefined);
      load();
      const timer = setInterval(load, 30_000);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, []),
  );

  return walkers;
}
