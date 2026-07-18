import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  // Simple async mutex — ensures only one write transaction runs at a time
  private static _writeLock: Promise<void> = Promise.resolve();

  /**
   * Serialize all write transactions through a single-lane queue.
   * Pass your async work as a callback; it will wait for the previous
   * transaction to finish before starting.
   */
  public static async withWriteLock<T>(work: () => Promise<T>): Promise<T> {
    let resolve!: () => void;
    const next = new Promise<void>(r => { resolve = r; });
    const current = this._writeLock;
    this._writeLock = next;

    await current; // wait for previous operation to finish
    try {
      return await work();
    } finally {
      resolve(); // release the lock for the next waiter
    }
  }

  public static async init(): Promise<void> {
    if (this.db) return;
    this.db = await SQLite.openDatabaseAsync('pulse.db');
    await this.setupSchema();
  }

  public static getDB(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized! Call DatabaseService.init() first.');
    }
    return this.db;
  }

  private static async setupSchema(): Promise<void> {
    const db = this.getDB();

    // Run each statement individually — execAsync with multiple statements uses an
    // implicit transaction which can clash if the DB is already in use.
    const statements = [
      `CREATE TABLE IF NOT EXISTS channels (
        channel_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS messages (
        local_id TEXT PRIMARY KEY,
        server_id TEXT,
        channel_id TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        sender_name TEXT,
        text TEXT,
        status TEXT DEFAULT 'sent',
        is_pinned INTEGER DEFAULT 0,
        is_forwarded INTEGER DEFAULT 0,
        is_edited INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        reply_to_id TEXT,
        reply_to_data TEXT,
        created_at DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        type TEXT,
        name TEXT,
        url TEXT,
        file_url TEXT,
        size INTEGER,
        duration INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        user_reacted INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS message_mentions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        display_name TEXT NOT NULL,
        start_index INTEGER NOT NULL,
        end_index INTEGER NOT NULL,
        mention_type TEXT DEFAULT 'USER',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `DROP TABLE IF EXISTS starred_messages`,
      `CREATE TABLE IF NOT EXISTS starred_messages (
        message_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        starred_at DATETIME NOT NULL,
        sync_state TEXT DEFAULT 'LOCAL'
      )`,
      `CREATE TABLE IF NOT EXISTS pending_queue (
        local_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        next_retry DATETIME,
        status TEXT DEFAULT 'pending'
      )`,
      `CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages (channel_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_server_id ON messages (server_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_channel_created ON messages (channel_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments (message_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions (message_id)`,
      `CREATE INDEX IF NOT EXISTS idx_message_mentions_message_id ON message_mentions (message_id)`,
      `CREATE INDEX IF NOT EXISTS idx_message_mentions_user_id ON message_mentions (user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_starred_messages_message_id ON starred_messages (message_id)`,
      `CREATE INDEX IF NOT EXISTS idx_starred_messages_starred_at ON starred_messages (starred_at)`,
    ];

    try {
      for (const sql of statements) {
        await db.runAsync(sql);
      }
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  public static async resetDatabase(): Promise<void> {
    const db = this.getDB();
    await db.runAsync('DROP TABLE IF EXISTS channels');
    await db.runAsync('DROP TABLE IF EXISTS messages');
    await db.runAsync('DROP TABLE IF EXISTS attachments');
    await db.runAsync('DROP TABLE IF EXISTS reactions');
    await db.runAsync('DROP TABLE IF EXISTS message_mentions');
    await db.runAsync('DROP TABLE IF EXISTS starred_messages');
    await db.runAsync('DROP TABLE IF EXISTS pending_queue');
    await this.setupSchema();
  }
}
