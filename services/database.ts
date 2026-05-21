import type { User } from '@/types';
import type { CropPlan, FarmTask, PlanStatus, TaskStatus } from '@/types/crop-management';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQLiteDB = any;

let db: SQLiteDB | null = null;

async function getSQLite() {
  try {
    return await import('expo-sqlite');
  } catch {
    return null;
  }
}

export async function getDatabase(): Promise<SQLiteDB> {
  if (db) return db;
  const SQLite = await getSQLite();
  if (!SQLite) throw new Error('expo-sqlite is not installed');
  db = await SQLite.openDatabaseAsync('zimfarm.db');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLiteDB) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS crop_plans (
      id TEXT PRIMARY KEY NOT NULL,
      userId TEXT NOT NULL,
      cropId TEXT NOT NULL,
      cropName TEXT NOT NULL,
      plantDate TEXT NOT NULL,
      harvestDate TEXT NOT NULL,
      hectares REAL NOT NULL,
      expectedYieldKg REAL NOT NULL,
      expectedRevenueUSD REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      cropPlanId TEXT NOT NULL,
      cropName TEXT NOT NULL,
      taskType TEXT NOT NULL,
      title TEXT NOT NULL,
      dueDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      notificationId TEXT,
      smsScheduled INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (cropPlanId) REFERENCES crop_plans(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      dataJson TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cached_products (
      id TEXT PRIMARY KEY NOT NULL,
      dataJson TEXT NOT NULL,
      cachedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cached_crop_data (
      id TEXT PRIMARY KEY NOT NULL,
      dataJson TEXT NOT NULL,
      cachedAt TEXT NOT NULL
    );
  `);

  await migrateTasksSmsColumn(database);
}

async function migrateTasksSmsColumn(database: SQLiteDB) {
  try {
    const cols = await database.getAllAsync('PRAGMA table_info(tasks)');
    if (!cols.some((c: { name: string }) => c.name === 'smsScheduled')) {
      await database.execAsync(
        `ALTER TABLE tasks ADD COLUMN smsScheduled INTEGER NOT NULL DEFAULT 0`
      );
    }
  } catch {
    // ignore migration errors on unusual SQLite builds
  }
}

// ─── Crop Plans ─────────────────────────────────────────────

export async function insertCropPlan(plan: CropPlan): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO crop_plans (id, userId, cropId, cropName, plantDate, harvestDate, hectares, expectedYieldKg, expectedRevenueUSD, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    plan.id,
    plan.userId,
    plan.cropId,
    plan.cropName,
    plan.plantDate,
    plan.harvestDate,
    plan.hectares,
    plan.expectedYieldKg,
    plan.expectedRevenueUSD,
    plan.status,
    plan.createdAt
  );
}

export async function getCropPlans(userId: string, status?: PlanStatus): Promise<CropPlan[]> {
  const database = await getDatabase();
  const rows = status
    ? await database.getAllAsync(
        `SELECT * FROM crop_plans WHERE userId = ? AND status = ? ORDER BY plantDate ASC`,
        userId,
        status
      )
    : await database.getAllAsync(
        `SELECT * FROM crop_plans WHERE userId = ? ORDER BY plantDate ASC`,
        userId
      );
  return rows.map(rowToPlan);
}

export async function getCropPlanById(id: string): Promise<CropPlan | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync(
    `SELECT * FROM crop_plans WHERE id = ?`,
    id
  );
  return row ? rowToPlan(row) : null;
}

export async function updateCropPlanStatus(id: string, status: PlanStatus): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE crop_plans SET status = ? WHERE id = ?`, status, id);
}

export async function deleteCropPlan(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM tasks WHERE cropPlanId = ?`, id);
  await database.runAsync(`DELETE FROM crop_plans WHERE id = ?`, id);
}

// ─── Tasks ──────────────────────────────────────────────────

export async function insertTask(task: FarmTask): Promise<void> {
  const database = await getDatabase();
  const sms = task.smsScheduled ? 1 : 0;
  await database.runAsync(
    `INSERT INTO tasks (id, cropPlanId, cropName, taskType, title, dueDate, status, priority, notificationId, smsScheduled)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    task.id,
    task.cropPlanId,
    task.cropName,
    task.taskType,
    task.title,
    task.dueDate,
    task.status,
    task.priority,
    task.notificationId,
    sms
  );
}

export async function insertTasks(tasks: FarmTask[]): Promise<void> {
  for (const task of tasks) {
    await insertTask(task);
  }
}

export async function getTasks(userId: string): Promise<FarmTask[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync(
    `SELECT t.* FROM tasks t
     INNER JOIN crop_plans p ON t.cropPlanId = p.id
     WHERE p.userId = ?
     ORDER BY t.dueDate ASC`,
    userId
  );
  return rows.map(rowToTask);
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE tasks SET status = ? WHERE id = ?`, status, id);
}

export async function updateTaskDueDate(id: string, dueDate: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE tasks SET dueDate = ?, status = 'pending' WHERE id = ?`, dueDate, id);
}

export async function deleteTask(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM tasks WHERE id = ?`, id);
}

export async function getTaskById(id: string): Promise<FarmTask | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync(
    `SELECT * FROM tasks WHERE id = ?`,
    id
  );
  return row ? rowToTask(row) : null;
}

export async function updateTaskNotificationId(
  id: string,
  notificationId: string | null
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `UPDATE tasks SET notificationId = ? WHERE id = ?`,
    notificationId ?? null,
    id
  );
}

export async function updateTaskSmsScheduled(id: string, scheduled: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`UPDATE tasks SET smsScheduled = ? WHERE id = ?`, scheduled ? 1 : 0, id);
}

// ─── Offline user cache ─────────────────────────────────────

export async function upsertUserCache(user: User): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO users (id, dataJson, updatedAt) VALUES (?,?,?)`,
    user.id,
    JSON.stringify(user),
    new Date().toISOString()
  );
}

export async function getUserCache(id: string): Promise<User | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync(
    `SELECT dataJson FROM users WHERE id = ?`,
    id
  );
  if (!row) return null;
  return JSON.parse((row as { dataJson: string }).dataJson) as User;
}

// ─── Cached market / crop blobs (offline) ───────────────────

export async function upsertCachedProduct(id: string, dataJson: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_products (id, dataJson, cachedAt) VALUES (?,?,?)`,
    id,
    dataJson,
    new Date().toISOString()
  );
}

export async function getCachedProduct(id: string): Promise<{ dataJson: string; cachedAt: string } | null> {
  const database = await getDatabase();
  return database.getFirstAsync(
    `SELECT dataJson, cachedAt FROM cached_products WHERE id = ?`,
    id
  );
}

export async function getAllCachedProducts(): Promise<{ id: string; dataJson: string; cachedAt: string }[]> {
  const database = await getDatabase();
  return database.getAllAsync(
    `SELECT id, dataJson, cachedAt FROM cached_products ORDER BY cachedAt DESC`
  );
}

export async function clearCachedProducts(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`DELETE FROM cached_products`);
}

export async function upsertCachedCropData(id: string, dataJson: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO cached_crop_data (id, dataJson, cachedAt) VALUES (?,?,?)`,
    id,
    dataJson,
    new Date().toISOString()
  );
}

export async function getCachedCropData(id: string): Promise<{ dataJson: string; cachedAt: string } | null> {
  const database = await getDatabase();
  return database.getFirstAsync(
    `SELECT dataJson, cachedAt FROM cached_crop_data WHERE id = ?`,
    id
  );
}

function rowToPlan(row: Record<string, unknown>): CropPlan {
  return {
    id: String(row.id),
    userId: String(row.userId),
    cropId: String(row.cropId),
    cropName: String(row.cropName),
    plantDate: String(row.plantDate),
    harvestDate: String(row.harvestDate),
    hectares: Number(row.hectares),
    expectedYieldKg: Number(row.expectedYieldKg),
    expectedRevenueUSD: Number(row.expectedRevenueUSD),
    status: row.status as PlanStatus,
    createdAt: String(row.createdAt),
  };
}

function rowToTask(row: Record<string, unknown>): FarmTask {
  return {
    id: String(row.id),
    cropPlanId: String(row.cropPlanId),
    cropName: String(row.cropName),
    taskType: row.taskType as FarmTask['taskType'],
    title: String(row.title),
    dueDate: String(row.dueDate),
    status: row.status as TaskStatus,
    priority: row.priority as FarmTask['priority'],
    notificationId: row.notificationId ? String(row.notificationId) : null,
    smsScheduled: row.smsScheduled != null ? Number(row.smsScheduled) === 1 : false,
  };
}
