import { FarmMap, type FarmMapState } from '@/components/maps/farm-map';
import type { AppLocation } from '@/hooks/useLocation';

interface FullMapProps {
  centre: AppLocation;
  /** Bump this to fly the camera back to `centre`. */
  focusKey?: number;
  state?: FarmMapState;
}

/**
 * The map in the top half of the transport hub.
 *
 * It must live in a bounded box above the sheet, not as a full-screen native
 * surface behind the controls. Google's MapView draws above every React view
 * regardless of z-index, which is why this tab was a blank rectangle.
 */
export function FullMap({ centre, focusKey = 0, state = 'ready' }: FullMapProps) {
  return (
    <FarmMap
      centre={centre}
      focusKey={focusKey}
      state={state}
      showsUserLocation
      interactive
      markers={[
        {
          id: 'pickup',
          kind: 'pickup',
          latitude: centre.latitude,
          longitude: centre.longitude,
          title: 'Pickup',
          description: centre.label,
        },
      ]}
      accessibilityLabel={`Map around ${centre.label}`}
    />
  );
}
