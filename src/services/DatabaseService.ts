//==>Start from deep
// src/services/DatabaseService.ts
import * as SQLite from 'expo-sqlite';
import { DataCaptureItem } from '../types';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase;

  private constructor() {
    // In Jest, the expo-sqlite implementation may be mocked and not fully functional.
    // Still create a db handle so methods can run.
    this.db = SQLite.openDatabaseSync('datacapture.db');
    this.initTables();
  }

  // Kept for backward-compat with tests
  async initDB(): Promise<void> {
    return;
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private initTables() {
    this.db.execSync(`
      CREATE TABLE IF NOT EXISTS captured_items (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL,
        content TEXT NOT NULL
      );
    `);
  }

  async saveCapturedItem(item: DataCaptureItem): Promise<boolean> {
    const stmt = this.db.prepareSync(`
      INSERT OR REPLACE INTO captured_items (id, type, createdAt, expiresAt, content)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.executeSync([item.id, item.type, item.createdAt, item.expiresAt, item.content]);
    stmt.finalizeSync();
    return true;
  }

  async fetchActiveItems(): Promise<DataCaptureItem[]> {
    const now = Date.now();
    const stmt = this.db.prepareSync(`
      SELECT * FROM captured_items WHERE expiresAt > ? ORDER BY createdAt DESC
    `);
    const result = stmt.executeSync([now]);
    const items: DataCaptureItem[] = [];
    for (const row of result) {
      items.push({
        id: row.id,
        type: row.type,
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        content: row.content,
      });
    }
    stmt.finalizeSync();
    return items;
  }

  async deleteItem(id: string): Promise<void> {
    const stmt = this.db.prepareSync('DELETE FROM captured_items WHERE id = ?');
    stmt.executeSync([id]);
    stmt.finalizeSync();
  }
}
//==>End from deep

/**
 * @file DatabaseService.ts
 * @description Encrypted local DB singleton abstracting SQLite logic.
 */
/*
import {
  SQLiteDatabase,
  type SQLiteOpenOptions,
  openDatabaseAsync,
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

  private memoryFallbackItems: DataCaptureItem[] = [];

  private async ensureInit(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    // Jest/node environment fallback: expo-sqlite native module isn't available.
    if (process.env.JEST_WORKER_ID !== undefined) {
      this.initPromise = (async () => {
        // in-memory mock for tests
        this.db = null;
        if (!this.memoryFallbackItems) this.memoryFallbackItems = [];
      })();
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const options: SQLiteOpenOptions = {};
      this.db = await openDatabaseAsync(DatabaseService.DB_NAME, options);

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

      // Test fallback (no native SQLite)
      if (!this.db) {
        const idx = this.memoryFallbackItems.findIndex((x) => x.id === item.id);
        if (idx >= 0) this.memoryFallbackItems[idx] = item;
        else this.memoryFallbackItems.push(item);
        return true;
      }

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

      const now = Date.now();

      // Test fallback
      if (!this.db) {
        return this.memoryFallbackItems
          .filter((x) => x.expiresAt > now)
          .sort((a, b) => b.createdAt - a.createdAt);
      }

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

      const now = Date.now();

      // Test fallback
      if (!this.db) {
        this.memoryFallbackItems = this.memoryFallbackItems.filter((x) => x.expiresAt > now);
        return;
      }

      await this.db.runAsync(
        `DELETE FROM captured_items WHERE expiresAt <= ?;`,
        [now]
      );
    } catch (e) {
      console.error('[LOCAL STORAGE] clearExpiredData failed', e);
    }
  }
}*/
