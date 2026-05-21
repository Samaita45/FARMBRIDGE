import type { TransportProvider } from '@/types';
import type { TransportBooking, TransporterProfile, BookingStatus } from '@/types/transport';

import { getDatabase } from './database';

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
}

export function estimateDistanceKm(pickup: string, destination: string): number {
  const seed = (pickup.length + destination.length) * 3.7;
  return Math.round(Math.max(8, Math.min(150, seed + 15)));
}

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
      distanceKm, agreedPriceUSD, counterPriceUSD, status, paymentMethod, createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
    booking.createdAt
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
