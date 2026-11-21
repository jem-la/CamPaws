import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

import { DOG_COLOR, ME_COLOR, WALKER_COLOR, type LiveMapProps } from '@/components/live-map-types';
import { SCU_CENTER } from '@/lib/geo';

/** Phone map (Apple Maps on iOS, Google Maps on Android). The web version is live-map.web.tsx. */
export function LiveMap({ dogs, walkers, height, preview, onPress, focus, route }: LiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const located = dogs.filter((d) => d.latitude !== undefined && d.longitude !== undefined);

  useEffect(() => {
    if (!focus) return;
    const delta = (focus.radiusMeters / 111_000) * 3;
    mapRef.current?.animateToRegion({ ...focus, latitudeDelta: delta, longitudeDelta: delta }, 500);
  }, [focus]);

  const map = (
    <MapView
      ref={mapRef}
      style={{ height, width: '100%' }}
      provider={PROVIDER_DEFAULT}
      initialRegion={{ ...SCU_CENTER, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
      showsUserLocation
      showsMyLocationButton={!preview}
      scrollEnabled={!preview}
      zoomEnabled={!preview}
      pitchEnabled={false}
      rotateEnabled={false}
      pointerEvents={preview ? 'none' : 'auto'}>
      {located.map((d) => (
        <Marker
          key={`dog-${d.id}`}
          coordinate={{ latitude: d.latitude!, longitude: d.longitude! }}
          title={d.name}
          description={d.location ?? 'Tap to open profile'}
          pinColor={DOG_COLOR}
          onCalloutPress={() => router.push({ pathname: '/explore/[id]', params: { id: d.id } })}
        />
      ))}
      {route && route.length > 1 && (
        <Polyline coordinates={route} strokeColor={ME_COLOR} strokeWidth={5} lineCap="round" lineJoin="round" />
      )}
      {walkers.map((w) => (
        <Marker
          key={w.markerId}
          coordinate={{ latitude: w.latitude, longitude: w.longitude }}
          title="Dog walk in progress"
          description="Approximate area"
          pinColor={WALKER_COLOR}
        />
      ))}
    </MapView>
  );

  if (!preview) return map;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open the campus map" onPress={onPress}>
      <View pointerEvents="none">{map}</View>
    </Pressable>
  );
}
