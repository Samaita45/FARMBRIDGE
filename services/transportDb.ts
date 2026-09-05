import type { TransportProvider } from '@/types';
import type { TransportBooking, TransporterProfile, BookingStatus } from '@/types/transport';

import { getDatabase } from './database';
import { distanceKmBetween, findPlace } from '@/constants/zimbabwe-data/places';

export async function initTransportTables(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transport_bookings (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      providerId TEXT NOT NULL,
      providerName TEXT NOT NULL,
      providerPhone TEXT NOT NULL,
      vehicleType TEXT NOT NULL,
      pickup TEXT NOT NULL,
      destination TEXT NOT NULL,
      goodsDescription TEXT NOT NULL,
      weightKg REAL NOT NULL,
      category TEXT NOT NULL,
      preferredDate TEXT NOT NULL,
      distanceKm REAL NOT NULL,
      agreedPriceUSD REAL NOT NULL,
      counterPriceUSD REAL,
      status TEXT NOT NULL DEFAULT 'pending',
      paymentMethod TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transporter_profiles (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      nationalId TEXT NOT NULL,
      vehicleType TEXT NOT NULL,
      regNumber TEXT NOT NULL,
      capacity REAL NOT NULL,
      pricePerKm REAL NOT NULL,
      coverageAreas TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);
  await addBookingColumn(db, 'pickupLat', 'REAL');
  await addBookingColumn(db, 'pickupLng', 'REAL');
  await addBookingColumn(db, 'destinationLat', 'REAL');
  await addBookingColumn(db, 'destinationLng', 'REAL');
  await addBookingColumn(db, 'durationSeconds', 'REAL');
  await addBookingColumn(db, 'routePolyline', 'TEXT');
}

async function addBookingColumn(
  db: Awaited<ReturnType<typeof getDatabase>>,
  name: string,
  type: string
): Promise<void> {
  try {
    await db.execAsync(`ALTER TABLE transport_bookings ADD COLUMN ${name} ${type}`);
  } catch {
    // Column already exists on later launches.
  }
}

/**
 * Road distance between two places, in kilometres, or null when either end
 * cannot be resolved to a town.
 *
 * WHAT THIS USED TO DO. It multiplied the combined character length of the two
 * strings by 3.7 and clamped the result. "Harare" to "Bulawayo" — 439 km by
 * road — came out as 66, and that fabricated number was multiplied by each
 * transporter's per-kilometre rate to produce the quotes people were choosing
 * between. It was not an estimate; it was the length of the words.
 *
 * It is now a great-circle distance between the two town centres, multiplied
 * by 1.25 because roads are not straight lines. That is still an estimate and
 * every screen that shows it says so, but it is an estimate of the distance
 * rather than of the spelling.
 */
export function estimateDistanceKm(pickup: string, destination: string): number | null {
  const from = findPlace(pickup);
  const to = findPlace(destination);
  if (!from || !to) return null;
  return estimateDistanceKmFromCoords(from, to);
}

export function estimateDistanceKmFromCoords(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const straight = distanceKmBetween(from, to);
  // Same town: still a real trip across it, so never quote zero.
  return Math.max(5, Math.round(straight * ROAD_FACTOR));
}

/** Roads wander. Zimbabwe's trunk routes run about a quarter longer than the crow flies. */
const ROAD_FACTOR = 1.25;

export function estimatePrice(provider: TransportProvider, distanceKm: number): number {
  return Math.round((provider.basePrice + provider.pricePerKm * distanceKm) * 100) / 100;
}

export async function insertBooking(booking: TransportBooking): Promise<void> {
  await initTransportTables();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO transport_bookings (
      id, userId, providerId, providerName, providerPhone, vehicleType,
      pickup, destination, goodsDescription, weightKg, category, preferredDate,
      distanceKm, agreedPriceUSD, counterPriceUSD, status, paymentMethod, createdAt,
      pickupLat, pickupLng, destinationLat, destinationLng, durationSeconds, routePolyline
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    booking.id,
    booking.userId,
    booking.providerId,
    booking.providerName,
    booking.providerPhone,
    booking.vehicleType,
    booking.pickup,
    booking.destination,
    booking.goodsDescription,
    booking.weightKg,
    booking.category,
    booking.preferredDate,
    booking.distanceKm,
    booking.agreedPriceUSD,
    booking.counterPriceUSD ?? null,
    booking.status,
    booking.paymentMethod,
    booking.createdAt,
    booking.pickupLat ?? null,
    booking.pickupLng ?? null,
    booking.destinationLat ?? null,
    booking.destinationLng ?? null,
    booking.durationSeconds ?? null,
    booking.routePolyline ?? null
  );
}

export async function getBookings(userId: string): Promise<TransportBooking[]> {
  await initTransportTables();
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM transport_bookings WHERE userId = ? ORDER BY createdAt DESC`,
    userId
  )) as Record<string, unknown>[];
  return rows.map(rowToBooking);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE transport_bookings SET status = ? WHERE id = ?`, status, id);
}

export async function insertTransporterProfile(profile: TransporterProfile): Promise<void> {
  await initTransportTables();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO transporter_profiles (
      id, userId, name, phone, nationalId, vehicleType, regNumber,
      capacity, pricePerKm, coverageAreas, verified, createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    profile.id,
    profile.userId,
    profile.name,
    profile.phone,
    profile.nationalId,
    profile.vehicleType,
    profile.regNumber,
    profile.capacity,
    profile.pricePerKm,
    JSON.stringify(profile.coverageAreas),
    profile.verified ? 1 : 0,
    profile.createdAt
  );
}

export async function getTransporterByUser(userId: string): Promise<TransporterProfile | null> {
  await initTransportTables();
  const db = await getDatabase();
  const row = (await db.getFirstAsync(
    `SELECT * FROM transporter_profiles WHERE userId = ?`,
    userId
  )) as Record<string, unknown> | null;
  return row ? rowToProfile(row) : null;
}

function rowToBooking(row: Record<string, unknown>): TransportBooking {
  return {
    id: String(row.id),
    userId: String(row.userId),
    providerId: String(row.providerId),
    providerName: String(row.providerName),
    providerPhone: String(row.providerPhone),
    vehicleType: row.vehicleType as TransportBooking['vehicleType'],
    pickup: String(row.pickup),
    destination: String(row.destination),
    pickupLat: row.pickupLat != null ? Number(row.pickupLat) : undefined,
    pickupLng: row.pickupLng != null ? Number(row.pickupLng) : undefined,
    destinationLat: row.destinationLat != null ? Number(row.destinationLat) : undefined,
    destinationLng: row.destinationLng != null ? Number(row.destinationLng) : undefined,
    durationSeconds: row.durationSeconds != null ? Number(row.durationSeconds) : undefined,
    routePolyline: row.routePolyline != null ? String(row.routePolyline) : undefined,
    goodsDescription: String(row.goodsDescription),
    weightKg: Number(row.weightKg),
    category: row.category as TransportBooking['category'],
    preferredDate: String(row.preferredDate),
    distanceKm: Number(row.distanceKm),
    agreedPriceUSD: Number(row.agreedPriceUSD),
    counterPriceUSD: row.counterPriceUSD != null ? Number(row.counterPriceUSD) : undefined,
    status: row.status as BookingStatus,
    paymentMethod: String(row.paymentMethod),
    createdAt: String(row.createdAt),
  };
}

function rowToProfile(row: Record<string, unknown>): TransporterProfile {
  return {
    id: String(row.id),
    userId: String(row.userId),
    name: String(row.name),
    phone: String(row.phone),
    nationalId: String(row.nationalId),
    vehicleType: row.vehicleType as TransporterProfile['vehicleType'],
    regNumber: String(row.regNumber),
    capacity: Number(row.capacity),
    pricePerKm: Number(row.pricePerKm),
    coverageAreas: JSON.parse(String(row.coverageAreas)) as string[],
    verified: Number(row.verified) === 1,
    createdAt: String(row.createdAt),
  };
}
