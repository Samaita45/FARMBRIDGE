export const TRANSPORT_EVENTS = {
  REQUEST_CREATED: 'transport:request:created',
  BID_CREATED: 'transport:bid:created',
  BID_UPDATED: 'transport:bid:updated',
  BOOKING_ACCEPTED: 'transport:booking:accepted',
  DRIVER_LOCATION: 'transport:driver:location',
  STATUS_UPDATED: 'transport:status:updated',
} as const;

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function transportersRoom(tenantId: string): string {
  return `tenant-transporters:${tenantId}`;
}

export function bookingRoom(bookingId: string): string {
  return `booking:${bookingId}`;
}
