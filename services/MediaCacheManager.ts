import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500 MB

export interface MediaCacheEntry {
  message_id: string;
  media_url: string;
  media_type: string;
  thumbnail_uri: string | null;
  local_uri: string | null;
  last_accessed: number;
  size_bytes: number;
}

class MediaCacheService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Ensure directories exist
      const cacheDir = FileSystem.cacheDirectory + 'cache/';
      const thumbDir = cacheDir + 'thumbnails/';
      const videoDir = cacheDir + 'videos/';
      const imageDir = cacheDir + 'images/';
      const docDir   = cacheDir + 'documents/';

      for (const dir of [cacheDir, thumbDir, videoDir, imageDir, docDir]) {
        const info = await FileSystem.getInfoAsync(dir);
        if (!info.exists) {
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        }
      }

      // Initialize SQLite
      this.db = await SQLite.openDatabaseAsync('media_cache.db');
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS media_cache (
          message_id TEXT PRIMARY KEY,
          media_url TEXT,
          media_type TEXT,
          thumbnail_uri TEXT,
          local_uri TEXT,
          last_accessed INTEGER,
          size_bytes INTEGER
        );
      `);

      // Attempt to add new columns in case the table was created by an older version of the app
      const columnsToAdd = [
        'ALTER TABLE media_cache ADD COLUMN media_url TEXT;',
        'ALTER TABLE media_cache ADD COLUMN media_type TEXT;',
        'ALTER TABLE media_cache ADD COLUMN thumbnail_uri TEXT;',
        'ALTER TABLE media_cache ADD COLUMN local_uri TEXT;',
        'ALTER TABLE media_cache ADD COLUMN last_accessed INTEGER;',
        'ALTER TABLE media_cache ADD COLUMN size_bytes INTEGER;'
      ];
      
      for (const stmt of columnsToAdd) {
        try {
          await this.db.execAsync(stmt);
        } catch (e) {
          // Ignore error, column likely already exists
        }
      }

      this.initialized = true;
    } catch (e) {
      console.error("MediaCacheManager init error:", e);
    } finally {
      this.initPromise = null;
    }
    })();
  }

  async getMediaState(messageId: string): Promise<MediaCacheEntry | null> {
    if (!messageId) return null;
    if (!this.initialized) await this.init();
    if (!this.db) return null;

    try {
      const result = await this.db.getFirstAsync<MediaCacheEntry>(
        'SELECT * FROM media_cache WHERE message_id = $id',
        { $id: messageId }
      );
      if (result) {
        await this.updateLastAccessed(messageId);
      }
      return result || null;
    } catch (e) {
      console.error("getMediaState error:", e);
      return null;
    }
  }

  async saveThumbnail(messageId: string, mediaUrl: string, uri: string, sizeBytes: number) {
    if (!messageId) return;
    if (!this.initialized) await this.init();
    if (!this.db) return;

    try {
      const existing = await this.getMediaState(messageId);
      const now = Date.now();
      
      if (existing) {
        const newSize = (existing.size_bytes || 0) + sizeBytes;
        await this.db.runAsync(
          'UPDATE media_cache SET thumbnail_uri = $thumb, last_accessed = $last, size_bytes = $size WHERE message_id = $id',
          { $thumb: uri || "", $last: now, $size: newSize, $id: messageId }
        );
      } else {
        await this.db.runAsync(
          'INSERT INTO media_cache (message_id, media_url, media_type, thumbnail_uri, local_uri, last_accessed, size_bytes) VALUES ($id, $url, $type, $thumb, $video, $last, $size)',
          { $id: messageId, $url: mediaUrl || "", $type: "video", $thumb: uri || "", $video: "", $last: now, $size: sizeBytes || 0 }
        );
      }
      this.enforceLRU();
    } catch (e) {
      console.error("saveThumbnail error:", e);
    }
  }

  async saveMedia(messageId: string, mediaUrl: string, uri: string, sizeBytes: number, mediaType: string = 'video') {
    if (!messageId) return;
    if (!this.initialized) await this.init();
    if (!this.db) return;

    try {
      const existing = await this.getMediaState(messageId);
      const now = Date.now();

      if (existing) {
        const newSize = (existing.size_bytes || 0) + sizeBytes;
        await this.db.runAsync(
          'UPDATE media_cache SET local_uri = $video, last_accessed = $last, size_bytes = $size WHERE message_id = $id',
          { $video: uri || "", $last: now, $size: newSize, $id: messageId }
        );
      } else {
        await this.db.runAsync(
          'INSERT INTO media_cache (message_id, media_url, media_type, thumbnail_uri, local_uri, last_accessed, size_bytes) VALUES ($id, $url, $type, $thumb, $video, $last, $size)',
          { $id: messageId, $url: mediaUrl || "", $type: mediaType, $thumb: "", $video: uri || "", $last: now, $size: sizeBytes || 0 }
        );
      }
      this.enforceLRU();
    } catch (e) {
      console.error("saveMedia error:", e);
    }
  }

  async updateLastAccessed(messageId: string) {
    if (!messageId) return;
    if (!this.db) return;
    try {
      await this.db.runAsync(
        'UPDATE media_cache SET last_accessed = $last WHERE message_id = $id',
        { $last: Date.now(), $id: messageId }
      );
    } catch (e) {
      // Ignore background errors
    }
  }

  async enforceLRU() {
    if (!this.db) return;
    try {
      const result = await this.db.getFirstAsync<{ total_size: number }>(
        'SELECT SUM(size_bytes) as total_size FROM media_cache'
      );
      
      let currentSize = result?.total_size || 0;
      
      if (currentSize > MAX_CACHE_SIZE) {
        // Find oldest items
        const oldestItems = await this.db.getAllAsync<MediaCacheEntry>(
          'SELECT * FROM media_cache ORDER BY last_accessed ASC LIMIT 5'
        );

        for (const item of oldestItems) {
          if (currentSize <= MAX_CACHE_SIZE) break;

          if (item.local_uri) {
            try {
              await FileSystem.deleteAsync(item.local_uri, { idempotent: true });
            } catch (e) {}
          }
          if (item.thumbnail_uri) {
            try {
              await FileSystem.deleteAsync(item.thumbnail_uri, { idempotent: true });
            } catch (e) {}
          }

          await this.db.runAsync('DELETE FROM media_cache WHERE message_id = $id', { $id: item.message_id });
          currentSize -= (item.size_bytes || 0);
        }
      }
    } catch (e) {
      console.error("enforceLRU error:", e);
    }
  }
}

export const MediaCacheManager = new MediaCacheService();
