import type { MarketOrder } from '@/types/market';

import { getDatabase } from './database';

export async function initOrdersTable(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS market_orders (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      itemsJson TEXT NOT NULL,
      subtotalUSD REAL NOT NULL,
      subtotalZWG REAL NOT NULL,
      deliveryAddress TEXT NOT NULL,
      deliveryMethod TEXT NOT NULL,
      paymentMethod TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL
    );
  `);
}

export async function insertOrder(order: MarketOrder): Promise<void> {
  await initOrdersTable();
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO market_orders (id, userId, itemsJson, subtotalUSD, subtotalZWG, deliveryAddress, deliveryMethod, paymentMethod, status, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    order.id,
    order.userId,
    JSON.stringify(order.items),
    order.subtotalUSD,
    order.subtotalZWG,
    order.deliveryAddress,
    order.deliveryMethod,
    order.paymentMethod,
    order.status,
    order.createdAt
  );
}

export async function getOrders(userId: string): Promise<MarketOrder[]> {
  await initOrdersTable();
  const db = await getDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM market_orders WHERE userId = ? ORDER BY createdAt DESC`,
    userId
  )) as Record<string, unknown>[];
  return rows.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    userId: String(row.userId),
    items: JSON.parse(String(row.itemsJson)),
    subtotalUSD: Number(row.subtotalUSD),
    subtotalZWG: Number(row.subtotalZWG),
    deliveryAddress: String(row.deliveryAddress),
    deliveryMethod: row.deliveryMethod as MarketOrder['deliveryMethod'],
    paymentMethod: String(row.paymentMethod),
    status: row.status as MarketOrder['status'],
    createdAt: String(row.createdAt),
  }));
}
