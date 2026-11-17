import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, View } from 'react-native';

import type { LiveMapProps } from '@/components/live-map-types';

/**
 * Web map. Leaflet needs the browser's `window`, so it is loaded only after the page
 * is running in the browser (the web build also renders pages on the server).
 */
export function LiveMap(props: LiveMapProps) {
  const [Map, setMap] = useState<ComponentType<LiveMapProps> | null>(null);

  useEffect(() => {
    import('@/components/leaflet-map').then((m) => setMap(() => m.LeafletMap));
  }, []);

  if (!Map) {
    return (
      <View style={{ height: props.height, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1eeef' }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Map {...props} />;
}
