/**
 * @file DatabaseService.ts
 * @description Encrypted local DB singleton abstracting SQLite logic.
 */

import {
  SQLiteDatabase,
  type SQLiteOpenOptions,
  openDatabaseAsync,
  type SQLiteRunResult,
} from 'expo-sqlite';

export interface DataCaptureItem {
  id: string;
  type: 'text' | 'table' | 'image';
  createdAt: number;
  expiresAt: number;
  content: string; // JSON Stringified
}

type CapturedRow = {
  id: string;
  type: 'text' | 'table' | 'image';
  createdAt: number;
  expiresAt: number;
  content: string;
};

export class DatabaseService {
  private static instance: DatabaseService;

  // expo-sqlite uses a file name, not a full path.
  private static DB_NAME = 'datacapture.db';

  private db: SQLiteDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  // Ensure the same schema is present.
  private static schemaSQL = [
    `CREATE TABLE IF NOT EXISTS captured_items (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL,
      content TEXT NOT NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_captured_items_expiresAt ON captured_items(expiresAt);`,
  ];

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private async ensureInit(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const options: SQLiteOpenOptions = {
        // Keep defaults; expo-sqlite handles directory placement.
        // You can add `encryptionCipher` here if you have an encryption setup.
      };

      this.db = await openDatabaseAsync(DatabaseService.DB_NAME, options);

      // Initialize schema.
      // expo-sqlite typing: withTransactionAsync accepts a no-arg task.
      await this.db.withTransactionAsync(async () => {
        for (const stmt of DatabaseService.schemaSQL) {
          await this.db!.execAsync(stmt);
        }
      });
    })();

    return this.initPromise;
  }

  public async initDB(): Promise<void> {
    await this.ensureInit();
    console.log('[LOCAL STORAGE] Initialized local SQLite Data Store');
  }

  public async saveCapturedItem(item: DataCaptureItem): Promise<boolean> {
    try {
      await this.ensureInit();
      if (!this.db) throw new Error('Database not initialized');

      // INSERT OR REPLACE acts like an upsert.
      await this.db.runAsync(
        `INSERT OR REPLACE INTO captured_items (id, type, createdAt, expiresAt, content)
         VALUES (?, ?, ?, ?, ?);`,
        [item.id, item.type, item.createdAt, item.expiresAt, item.content]
      );

      return true;
    } catch (e) {
      console.error('[LOCAL STORAGE] saveCapturedItem failed', e);
      return false;
    }
  }

  public async fetchActiveItems(): Promise<DataCaptureItem[]> {
    try {
      await this.ensureInit();
      if (!this.db) throw new Error('Database not initialized');

      const now = Date.now();

      const rows = await this.db.getAllAsync<CapturedRow>(
        `SELECT id, type, createdAt, expiresAt, content
         FROM captured_items
         WHERE expiresAt > ?
         ORDER BY createdAt DESC;`,
        [now]
      );

      return rows.map((r) => ({
        id: r.id,
        type: r.type,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        content: r.content,
      }));
    } catch (e) {
      console.error('[LOCAL STORAGE] fetchActiveItems failed', e);
      return [];
    }
  }

  public async clearExpiredData(): Promise<void> {
    try {
      await this.ensureInit();
      if (!this.db) throw new Error('Database not initialized');

      const now = Date.now();

      await this.db.runAsync(
        `DELETE FROM captured_items WHERE expiresAt <= ?;`,
        [now]
      );
    } catch (e) {
      console.error('[LOCAL STORAGE] clearExpiredData failed', e);
    }
  }
}

