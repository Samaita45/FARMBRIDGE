import { io, type Socket } from 'socket.io-client';

import { getValidAccessToken } from '@/services/api/client';
import { API_BASE_URL, IS_API_ENABLED } from '@/services/api/config';
import type { TransportLifecycleStatus } from '@/types/transport';

/**
 * The realtime connection to the transport gateway.
 *
 * ONE SOCKET FOR THE WHOLE APP. Several screens care about the same events —
 * the trips list, an open booking, the transporter's job feed — and a socket
 * per screen would mean several authenticated connections per user and
 * duplicate deliveries when two are mounted. This module owns exactly one and
 * hands out subscriptions to it.
 *
 * IT AUTHENTICATES ON THE HANDSHAKE, NOT PER MESSAGE. That is the gateway's
 * contract, and it has a consequence worth stating: a WebSocket authenticates
 * once, so connecting with a token that expires in ten seconds gives a
 * connection the server drops ten seconds later. The token is fetched through
 * `getValidAccessToken`, which refreshes first when it is close to expiry, and
 * is re-fetched on every reconnection attempt rather than captured once.
 *
 * IT IS OPTIONAL. FarmBridge runs fully on-device by default, and with the API
 * disabled `connectRealtime` does nothing and every subscription is a no-op.
 * Nothing here may become a requirement for a screen to render — a farmer with
 * no backend must still see their own bookings.
 */

/** Payloads are narrow on purpose: a screen should refetch, not trust a socket. */
export interface BidEvent {
  bid: { id: string; requestId: string; transporterId: string; priceUsd: number; status: string };
}

export interface BookingAcceptedEvent {
  booking: { id: string; requestId: string; transporterId: string };
}

export interface DriverLocationEvent {
  bookingId: string;
  latitude: number;
  longitude: number;
  /** Epoch ms, from the driver's device. */
  at: number;
}

export interface StatusUpdatedEvent {
  bookingId: string;
  status: TransportLifecycleStatus;
}

export interface RequestCreatedEvent {
  request: { id: string; pickupAddress: string; destinationAddress: string; distanceMeters: number };
}

export interface RealtimeEvents {
  'transport:request:created': RequestCreatedEvent;
  'transport:bid:created': BidEvent;
  'transport:bid:updated': BidEvent;
  'transport:booking:accepted': BookingAcceptedEvent;
  'transport:driver:location': DriverLocationEvent;
  'transport:status:updated': StatusUpdatedEvent;
}

export type RealtimeEventName = keyof RealtimeEvents;

export type RealtimeStatus = 'disabled' | 'idle' | 'connecting' | 'connected' | 'error';

let socket: Socket | null = null;
let status: RealtimeStatus = IS_API_ENABLED ? 'idle' : 'disabled';
const statusListeners = new Set<(next: RealtimeStatus) => void>();

/** Bookings this client has asked to follow, re-sent after every reconnection. */
const subscribedBookings = new Set<string>();

function setStatus(next: RealtimeStatus): void {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

export function getRealtimeStatus(): RealtimeStatus {
  return status;
}

export function onRealtimeStatus(listener: (next: RealtimeStatus) => void): () => void {
  statusListeners.add(listener);
  listener(status);
  return () => statusListeners.delete(listener);
}

/**
 * Opens the connection, or returns the existing one.
 *
 * Safe to call from several screens: the second caller gets the first socket.
 */
export function connectRealtime(): Socket | null {
  if (!IS_API_ENABLED || !API_BASE_URL) return null;
  if (socket) return socket;

  setStatus('connecting');

  socket = io(`${API_BASE_URL}/realtime`, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 15_000,
    /*
      The token is resolved per attempt rather than captured once. Socket.IO
      calls this before each connect, including every reconnect, so a socket
      that drops during a long session comes back with a token that is still
      valid instead of retrying forever with a stale one.
    */
    auth: (cb) => {
      void getValidAccessToken().then((token) => cb({ token: token ?? '' }));
    },
  });

  socket.on('connect', () => {
    setStatus('connected');
    // Rooms are per-socket, so a reconnect starts with none. Re-joining here is
    // what stops a dropped connection silently ending live tracking.
    subscribedBookings.forEach((bookingId) => {
      socket?.emit('transport:booking:subscribe', { bookingId });
    });
  });

  socket.on('disconnect', () => setStatus('connecting'));
  socket.on('connect_error', () => setStatus('error'));

  return socket;
}

/** Closes the connection and forgets what it was following. */
export function disconnectRealtime(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
  subscribedBookings.clear();
  setStatus(IS_API_ENABLED ? 'idle' : 'disabled');
}

/**
 * Listens for one event. Returns an unsubscribe function.
 *
 * The handler is typed against the event name, so a screen cannot read a field
 * off the wrong payload.
 */
export function onRealtime<E extends RealtimeEventName>(
  event: E,
  handler: (payload: RealtimeEvents[E]) => void
): () => void {
  const active = connectRealtime();
  if (!active) return () => undefined;

  /*
    Socket.IO types a listener as `(...args: any[])` for an arbitrary event
    name. The cast is confined to these two lines; the exported signature above
    is what callers see, and it keeps the payload tied to the event name.
  */
  const wrapped = (...args: unknown[]) => handler(args[0] as RealtimeEvents[E]);
  active.on(event as string, wrapped);
  return () => {
    active.off(event as string, wrapped);
  };
}

/**
 * Asks to follow one booking's room.
 *
 * The server decides. It joins the room only if the signed-in user is the
 * customer or the assigned transporter on an active booking, so a client
 * asking for someone else's booking is refused rather than served — which is
 * why the ack is honoured here instead of assumed.
 */
export function subscribeToBooking(bookingId: string): () => void {
  const active = connectRealtime();
  if (!active || !bookingId) return () => undefined;

  subscribedBookings.add(bookingId);
  active.emit('transport:booking:subscribe', { bookingId }, (ack?: { ok?: boolean }) => {
    if (!ack?.ok) subscribedBookings.delete(bookingId);
  });

  return () => {
    subscribedBookings.delete(bookingId);
  };
}
