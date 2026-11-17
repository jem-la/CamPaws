import type { MapMarkerDto } from '@/lib/api';
import type { Dog } from '@/lib/dogs-store';

export type Coords = { latitude: number; longitude: number };

export type LiveMapProps = {
  dogs: Dog[];
  walkers: MapMarkerDto[];
  height: number;
  /** Small preview: no panning or zooming, and a tap anywhere calls onPress. */
  preview?: boolean;
  onPress?: () => void;
  /** Move the map to show this spot. */
  focus?: Coords & { radiusMeters: number };
};

export const DOG_COLOR = '#c92e45';
export const WALKER_COLOR = '#2f6fed';
export const ME_COLOR = '#1a9b5a';
