import * as SQLite from 'expo-sqlite';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  public static async init(): Promise<void> {
    if (this.db) return;

    // Use async initialization for SDK 51+
    this.db = await SQLite.openDatabaseAsync('pulse.db');
    await this.setupSchema();
  }

  public static getDB(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error("Database not initialized! Call DatabaseService.init() first.");
    }
    return this.db;
  }

  private static async setupSchema(): Promise<void> {
    const db = this.getDB();
    
    // SQLite query to create all tables
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS channels (
        channel_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
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
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        type TEXT,
        name TEXT,
        url TEXT,
        file_url TEXT,
        size INTEGER,
        duration INTEGER
      );

      CREATE TABLE IF NOT EXISTS reactions (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        emoji TEXT NOT NULL,
        count INTEGER DEFAULT 1,
        user_reacted INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS pending_queue (
        local_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        retry_count INTEGER DEFAULT 0,
        next_retry DATETIME,
        status TEXT DEFAULT 'pending'
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages (channel_id);
      CREATE INDEX IF NOT EXISTS idx_messages_server_id ON messages (server_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
      CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments (message_id);
      CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON reactions (message_id);
    `;

    try {
      await db.execAsync(createTablesQuery);
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  // Helper method for clearing DB (useful during dev/testing)
  public static async resetDatabase(): Promise<void> {
    const db = this.getDB();
    await db.execAsync(`
      DROP TABLE IF EXISTS channels;
      DROP TABLE IF EXISTS messages;
      DROP TABLE IF EXISTS attachments;
      DROP TABLE IF EXISTS reactions;
      DROP TABLE IF EXISTS pending_queue;
    `);
    await this.setupSchema();
  }
}
