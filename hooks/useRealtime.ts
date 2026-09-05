import { useEffect, useRef, useState } from 'react';

import {
  connectRealtime,
  getRealtimeStatus,
  onRealtime,
  onRealtimeStatus,
  subscribeToBooking,
  type RealtimeEventName,
  type RealtimeEvents,
  type RealtimeStatus,
} from '@/services/realtime';

/**
 * Subscribes to one realtime event for the life of a component.
 *
 * THE HANDLER IS HELD IN A REF ON PURPOSE. A screen almost always passes an
 * inline arrow function, which is a new reference every render; listing it as a
 * dependency would tear down and re-register the listener on each one, and a
 * gap between the two is an event nobody receives. The subscription is created
 * once per event name and always calls the latest handler.
 */
export function useRealtimeEvent<E extends RealtimeEventName>(
  event: E,
  handler: (payload: RealtimeEvents[E]) => void
): void {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    return onRealtime(event, (payload) => latest.current(payload));
  }, [event]);
}

/**
 * Follows one booking's room while the component is mounted.
 *
 * Pass null when there is nothing to follow — a list screen with no booking
 * open — rather than calling this conditionally.
 */
export function useBookingSubscription(bookingId: string | null): void {
  useEffect(() => {
    if (!bookingId) return;
    return subscribeToBooking(bookingId);
  }, [bookingId]);
}

/**
 * The connection's state, for screens that show it.
 *
 * Worth surfacing rather than hiding: 'disabled' is the honest state of an
 * install with no backend, and a tracking screen that silently shows a stale
 * position is worse than one that says it is not live.
 */
export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(getRealtimeStatus);

  useEffect(() => {
    connectRealtime();
    return onRealtimeStatus(setStatus);
  }, []);

  return status;
}
