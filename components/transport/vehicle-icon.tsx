import { MaterialCommunityIcons } from '@expo/vector-icons';

import { DS } from '@/constants/design-system';
import type { VehicleType } from '@/types/transport';

/**
 * The one place the app is allowed to use an icon set other than Ionicons.
 *
 * Ionicons has no truck, lorry or tractor glyph — the vehicles this feature is
 * entirely about. Rather than approximate them with a bus, vehicle types come
 * from MaterialCommunityIcons, and only through this component, so the
 * exception stays contained and no screen imports a second set directly.
 *
 * These were emoji rendered as text until the icon sweep.
 */
const GLYPHS: Record<VehicleType, keyof typeof MaterialCommunityIcons.glyphMap> = {
  bakkie: 'truck-outline',
  truck: 'truck',
  lorry: 'truck-trailer',
  tractor: 'tractor',
};

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bakkie: 'Bakkie',
  truck: 'Truck',
  lorry: 'Lorry',
  tractor: 'Tractor',
};

interface VehicleIconProps {
  type: VehicleType;
  size?: number;
  color?: string;
}

export function VehicleIcon({ type, size = 20, color = DS.colors.primary }: VehicleIconProps) {
  return <MaterialCommunityIcons name={GLYPHS[type]} size={size} color={color} />;
}
