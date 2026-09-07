import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { transportApi } from '@/services/api/transport.api';
import { fastGetAsync, fastSet } from '@/services/fastStorage';

export const DRIVER_LOCATION_TASK = 'farmbridge-driver-location';

/**
 * The booking the background task is publishing for.
 *
 * WHY STORAGE AND NOT AN ARGUMENT. A TaskManager task is registered once at
 * module load and then invoked by the operating system in its own JavaScript
 * context — a fresh one, with no React tree, no Zustand store and none of the
 * closures that existed when the driver pressed the button. There is nowhere to
 * pass an argument to. The booking id has to be left somewhere the task can find
 * it on a cold start, and MMKV is the only synchronous store available.
 */
const ACTIVE_BOOKING_KEY = 'transport:background-booking';

/** Roughly a minute, or 250m. Battery matters on a phone that has to last the haul. */
const BACKGROUND_INTERVAL_MS = 60_000;
const BACKGROUND_DISTANCE_M = 250;

export function setBackgroundBooking(bookingId: string | null): void {
  fastSet(ACTIVE_BOOKING_KEY, bookingId ?? '');
}

async function getBackgroundBooking(): Promise<string | null> {
  const id = await fastGetAsync(ACTIVE_BOOKING_KEY);
  return id && id.length > 0 ? id : null;
}

/*
  Registered at module scope, on purpose.

  When the OS relaunches the app in the background to deliver a location, it
  evaluates the bundle and then looks for a task with this name. If registration
  happened inside a component or a hook, the task would not exist yet at the
  moment it is needed and the update would be dropped — the classic reason
  background location "works in the foreground only".
*/
TaskManager.defineTask(DRIVER_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.warn('[background-location]', error.message);
    return;
  }

  const bookingId = await getBackgroundBooking();
  if (!bookingId) return;

  const locations = (data as { locations?: Location.LocationObject[] } | null)?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest) return;

  try {
    await transportApi.updateDriverLocation(
      bookingId,
      latest.coords.latitude,
      latest.coords.longitude
    );
  } catch {
    /*
      Swallowed deliberately. This runs with no screen and nobody to tell, and
      the next fix is a minute away — throwing here would only put a crash in
      the OS's log for a lost network on a road between Gweru and Bulawayo.
      The trip screen shows the age of the last position, so a run of failures
      is visible where somebody can actually see it.
    */
  }
});

/** Whether the OS is currently delivering positions to us. */
export async function isBackgroundSharing(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(DRIVER_LOCATION_TASK);
  } catch {
    return false;
  }
}

export type BackgroundStartResult =
  | { ok: true }
  | { ok: false; reason: 'permission' | 'unavailable' };

/**
 * Start publishing this booking's position with the app in the background.
 *
 * The "Always" permission is requested only at this point — never at startup.
 * Asking for it before there is a trip to justify it is how the dialog gets
 * refused, and both stores expect the request to arrive attached to the feature
 * that needs it.
 */
export async function startBackgroundSharing(
  bookingId: string
): Promise<BackgroundStartResult> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') return { ok: false, reason: 'permission' };

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') return { ok: false, reason: 'permission' };

  // Written before the task starts, so the first delivery already knows which
  // booking it belongs to.
  setBackgroundBooking(bookingId);

  try {
    if (await isBackgroundSharing()) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    }
    await Location.startLocationUpdatesAsync(DRIVER_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: BACKGROUND_INTERVAL_MS,
      distanceInterval: BACKGROUND_DISTANCE_M,
      pausesUpdatesAutomatically: false,
      // Android 14 requires a visible, honest foreground notification for a
      // location service. It is also the driver's own reminder that this is on.
      foregroundService: {
        notificationTitle: 'FarmBridge is sharing your trip',
        notificationBody: 'The customer for this load can see where you are.',
        notificationColor: '#2D6A4F',
        killServiceOnDestroy: true,
      },
    });
    return { ok: true };
  } catch {
    setBackgroundBooking(null);
    return { ok: false, reason: 'unavailable' };
  }
}

/** Stop publishing. Safe to call when nothing is running. */
export async function stopBackgroundSharing(): Promise<void> {
  setBackgroundBooking(null);
  try {
    if (await isBackgroundSharing()) {
      await Location.stopLocationUpdatesAsync(DRIVER_LOCATION_TASK);
    }
  } catch {
    // Nothing to stop.
  }
}
