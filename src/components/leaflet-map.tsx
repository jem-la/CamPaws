// Web only: loaded by live-map.web.tsx once the page is running in the browser.
import 'leaflet/dist/leaflet.css';

import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';

import { DOG_COLOR, ME_COLOR, WALKER_COLOR, type Coords, type LiveMapProps } from '@/components/live-map-types';
import { SCU_CENTER } from '@/lib/geo';

/** Moves the map when `focus` changes (for example after "Find dogs near me"). */
function FlyTo({ focus }: { focus: LiveMapProps['focus'] }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    const zoom = focus.radiusMeters <= 300 ? 17 : focus.radiusMeters <= 600 ? 16 : focus.radiusMeters <= 1200 ? 15 : 14;
    map.flyTo([focus.latitude, focus.longitude], zoom);
  }, [focus, map]);
  return null;
}

export function LeafletMap({ dogs, walkers, height, preview, onPress, focus, route }: LiveMapProps) {
  const [me, setMe] = useState<Coords | null>(null);
  const located = dogs.filter((d) => d.latitude !== undefined && d.longitude !== undefined);

  // On the full map, show where you are (the browser asks for permission the first time).
  useEffect(() => {
    if (preview) return;
    let active = true;
    Location.requestForegroundPermissionsAsync()
      .then((perm) => (perm.granted ? Location.getCurrentPositionAsync({}) : null))
      .then((loc) => active && loc && setMe({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [preview]);

  const map = (
    <MapContainer
      center={[SCU_CENTER.latitude, SCU_CENTER.longitude]}
      zoom={preview ? 15 : 16}
      style={{ height, width: '100%', zIndex: 0 }}
      dragging={!preview}
      scrollWheelZoom={!preview}
      doubleClickZoom={!preview}
      touchZoom={!preview}
      zoomControl={!preview}
      keyboard={!preview}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyTo focus={focus} />
      {located.map((d) => (
        <CircleMarker
          key={`dog-${d.id}`}
          center={[d.latitude!, d.longitude!]}
          radius={9}
          pathOptions={{ color: '#fff', weight: 2, fillColor: DOG_COLOR, fillOpacity: 1 }}>
          <Popup>
            <strong>{d.name}</strong>
            {d.location ? <div>{d.location}</div> : null}
            <button
              type="button"
              style={{ marginTop: 6, cursor: 'pointer' }}
              onClick={() => router.push({ pathname: '/explore/[id]', params: { id: d.id } })}>
              Open profile
            </button>
          </Popup>
        </CircleMarker>
      ))}
      {route && route.length > 1 && (
        <Polyline positions={route.map((p) => [p.latitude, p.longitude] as [number, number])} pathOptions={{ color: ME_COLOR, weight: 5 }} />
      )}
      {walkers.map((w) => (
        <CircleMarker
          key={w.markerId}
          center={[w.latitude, w.longitude]}
          radius={11}
          pathOptions={{ color: WALKER_COLOR, weight: 2, fillColor: WALKER_COLOR, fillOpacity: 0.35 }}>
          <Popup>Dog walk in progress (approximate area)</Popup>
        </CircleMarker>
      ))}
      {me && (
        <CircleMarker
          center={[me.latitude, me.longitude]}
          radius={7}
          pathOptions={{ color: '#fff', weight: 3, fillColor: ME_COLOR, fillOpacity: 1 }}>
          <Popup>You are here</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );

  if (!preview) return map;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Open the campus map" onPress={onPress}>
      <View pointerEvents="none">{map}</View>
    </Pressable>
  );
}
