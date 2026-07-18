import { Message, ConversationSnapshot } from '../types/connects';
import { ConnectsService } from './connects.service';
import { DatabaseService } from './database.service';
import { MessageLocalDataSource } from './message.local.datasource';
import { MessageRemoteDataSource } from './message.remote.datasource';

export class MessageRepository {
  private localDataSource: MessageLocalDataSource;
  private remoteDataSource: MessageRemoteDataSource;

  constructor() {
    this.localDataSource = new MessageLocalDataSource();
    this.remoteDataSource = new MessageRemoteDataSource();
  }

  private listeners = new Map<string, Set<(snapshot: ConversationSnapshot) => void>>();
  private starredListeners = new Set<(snapshot: ConversationSnapshot) => void>();

  /**
   * Observe changes to a channel's messages in SQLite.
   * Instantly fires with current data, then again on any writes.
   */
  observe(channelId: string, callback: (snapshot: ConversationSnapshot) => void): () => void {
    if (!this.listeners.has(channelId)) {
      this.listeners.set(channelId, new Set());
    }
    this.listeners.get(channelId)!.add(callback);

    // Initial fetch to populate UI immediately
    this.loadConversation(channelId).then(snapshot => {
        if (snapshot) callback(snapshot);
    });

    // Return unsubscribe function
    return () => {
      const channelListeners = this.listeners.get(channelId);
      if (channelListeners) {
        channelListeners.delete(callback);
        if (channelListeners.size === 0) {
          this.listeners.delete(channelId);
          this.pendingNotifications.delete(channelId);
        }
      }
    };
  }

  /**
   * Observe all starred messages across all channels.
   */
  observeStarred(callback: (snapshot: ConversationSnapshot) => void): () => void {
    this.starredListeners.add(callback);

    this.getStarredMessagesSnapshot().then(snapshot => {
      if (snapshot) callback(snapshot);
    });

    return () => {
      this.starredListeners.delete(callback);
    };
  }

  private pendingNotifications = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingStarredNotification: ReturnType<typeof setTimeout> | null = null;

  /**
   * Internal method to broadcast SQLite changes to UI components
   */
  private notifyObservers(channelId: string) {
    if (this.pendingNotifications.has(channelId)) {
      clearTimeout(this.pendingNotifications.get(channelId)!);
    }

    const timeout = setTimeout(async () => {
      const channelListeners = this.listeners.get(channelId);
      if (channelListeners && channelListeners.size > 0) {
        const snapshot = await this.loadConversation(channelId);
        if (snapshot) {
          channelListeners.forEach(cb => cb(snapshot));
        }
      }
      this.pendingNotifications.delete(channelId);
    }, 100);

    this.pendingNotifications.set(channelId, timeout);

    // Also notify starred listeners if any data changed, just in case
    this.notifyStarredObservers();
  }

  private notifyStarredObservers() {
    if (this.pendingStarredNotification) {
      clearTimeout(this.pendingStarredNotification);
    }
    
    this.pendingStarredNotification = setTimeout(async () => {
      if (this.starredListeners.size > 0) {
        const snapshot = await this.getStarredMessagesSnapshot();
        if (snapshot) {
          this.starredListeners.forEach(cb => cb(snapshot));
        }
      }
      this.pendingStarredNotification = null;
    }, 100);
  }

  /**
   * Delta update: mark a message as deleted optimistically
   */
  async markMessageDeletedLocal(messageId: string, channelId: string): Promise<void> {
    const db = DatabaseService.getDB();
    await DatabaseService.withWriteLock(async () => {
      await db.runAsync(
        `UPDATE messages SET is_deleted = 1, text = 'This message was deleted' WHERE server_id = ? OR local_id = ?`,
        [messageId, messageId]
      );
      await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [messageId]);
    });
    this.notifyObservers(channelId);
  }

  /**
   * Delta update: toggle a reaction optimistically
   */
  async toggleReactionLocal(messageId: string, emoji: string, channelId: string): Promise<void> {
    const db = DatabaseService.getDB();
    const reactionId = `${messageId}_${emoji}`;

    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        const existing = await db.getFirstAsync<{ count: number, user_reacted: number }>(
          `SELECT count, user_reacted FROM reactions WHERE id = ?`,
          [reactionId]
        );

        if (existing) {
          let newCount = existing.count + (existing.user_reacted ? -1 : 1);
          let newUserReacted = existing.user_reacted ? 0 : 1;

          if (newCount <= 0 && newUserReacted === 0) {
            await db.runAsync(`DELETE FROM reactions WHERE id = ?`, [reactionId]);
          } else {
            await db.runAsync(
              `UPDATE reactions SET count = ?, user_reacted = ? WHERE id = ?`,
              [newCount, newUserReacted, reactionId]
            );
          }
        } else {
          await db.runAsync(
            `INSERT INTO reactions (id, message_id, emoji, count, user_reacted) VALUES (?, ?, ?, 1, 1)`,
            [reactionId, messageId, emoji]
          );
        }
      });
    });

    this.notifyObservers(channelId);
  }

  /**
   * Delta update: toggle a pin optimistically
   */
  async togglePinLocal(messageId: string, isPinned: boolean, channelId: string): Promise<void> {
    const db = DatabaseService.getDB();
    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        if (isPinned) {
          await db.runAsync(`UPDATE messages SET is_pinned = 0 WHERE channel_id = ?`, [channelId]);
          await db.runAsync(`UPDATE messages SET is_pinned = 1 WHERE server_id = ? OR local_id = ?`, [messageId, messageId]);
        } else {
          await db.runAsync(`UPDATE messages SET is_pinned = 0 WHERE server_id = ? OR local_id = ?`, [messageId, messageId]);
        }
      });
    });
    this.notifyObservers(channelId);
  }

  /**
   * Update message status locally
   */
  async updateMessageStatusLocal(localId: string, status: string, channelId: string): Promise<void> {
    const db = DatabaseService.getDB();
    await db.runAsync(
      `UPDATE messages SET status = ? WHERE local_id = ?`,
      [status, localId]
    );
    this.notifyObservers(channelId);
  }

  /**
   * Fetch messages for a channel. 
   * This immediately returns local data, but also can trigger a remote fetch if needed.
   */
  async getMessages(channelId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.localDataSource.getMessages(channelId, limit, offset);
  }

  /**
   * Load the full conversation snapshot for a channel, unifying messages, mentions, and metadata.
   * Channel metadata is stored in the file-based CacheService, NOT in SQLite.
   * We always load messages; metadata is optional.
   */
  async loadConversation(channelId: string): Promise<ConversationSnapshot | null> {
    const messages = await this.getMessages(channelId);

    // Try to get channel metadata from SQLite channels table (may be empty).
    // If not available, we still return the messages so the observer can fire.
    let channelMetadata: any = null;
    try {
      const db = DatabaseService.getDB();
      const channelRow = await db.getFirstAsync<{ data: string }>(
        `SELECT data FROM channels WHERE channel_id = ?`,
        [channelId]
      );
      if (channelRow) {
        channelMetadata = JSON.parse(channelRow.data);
      }
    } catch (e) {
      // Ignore — channel metadata will be unavailable but messages still render
    }

    return {
      messages,
      mentions: messages.flatMap(m => m.mentions || []),
      attachments: messages.flatMap(m => m.attachments || []),
      reactions: messages.flatMap(m => m.reactions || []),
      channelMetadata
    };
  }

  /**
   * Fetch a single message locally by server_id or local_id
   */
  async getMessage(messageId: string): Promise<Message | null> {
    return this.localDataSource.getMessage(messageId);
  }

  /**
   * Promote a pending message to sent using a targeted update
   * This prevents overwriting local mutations (like pins or reactions) that happened while the message was queued
   */
  async promotePendingMessageLocal(localId: string, serverMessage: Message, channelId: string): Promise<void> {
    const db = DatabaseService.getDB();
    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `UPDATE messages SET
            server_id = ?,
            status = ?,
            created_at = ?,
            text = COALESCE(?, text),
            sender_name = COALESCE(?, sender_name)
           WHERE local_id = ?`,
          [
            serverMessage.message_id,
            'sent',
            serverMessage.created_at,
            serverMessage.text ?? null,
            serverMessage.sender_name ?? null,
            localId
          ]
        );

        if (serverMessage.attachments && serverMessage.attachments.length > 0) {
          await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [localId]);
          for (const att of serverMessage.attachments) {
            const attId = att.id || `${localId}_${att.name}`;
            await db.runAsync(`
              INSERT OR REPLACE INTO attachments
              (id, message_id, type, name, url, file_url, size, duration)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              attId, localId,
              att.type || 'file', att.name || '',
              att.url || '', att.file_url || '',
              att.size || 0, att.duration || 0
            ]);
          }
        }
      });
    });

    this.notifyObservers(channelId);
  }

  /**
   * Save a single message locally
   */
  async saveMessageLocal(message: Message): Promise<void> {
    await this.localDataSource.saveMessage(message);
    this.notifyObservers(message.channel_id);
  }

  /**
   * Save an array of messages in a single SQLite transaction and notify observers ONCE.
   */
  async saveMessagesBatchLocal(messages: Message[], channelId: string): Promise<void> {
    if (messages.length === 0) return;
    await this.localDataSource.saveMessagesBatch(messages);
    this.notifyObservers(channelId);
  }

  /**
   * Delete a message locally
   */
  async deleteMessageLocal(messageId: string, channelId?: string): Promise<void> {
    await this.localDataSource.deleteMessage(messageId);
    if (channelId) {
      this.notifyObservers(channelId);
    }
  }

  /**
   * Trigger a sync with the remote backend for this channel
   */
  async syncChannelMessages(channelId: string, lastSync?: string, lastMessageId?: string): Promise<any> {
    const syncData = await ConnectsService.syncMessages(channelId, lastSync, lastMessageId);

    if (syncData && syncData.status) {
      // 1. Save new messages
      if (syncData.new && syncData.new.length > 0) {
        await this.localDataSource.saveMessagesBatch(syncData.new);
      }
      // 2. Update existing messages
      if (syncData.updated && syncData.updated.length > 0) {
        await this.localDataSource.saveMessagesBatch(syncData.updated);
      }
      // 3. Process deletions
      if (syncData.deleted && syncData.deleted.length > 0) {
        const db = DatabaseService.getDB();
        await DatabaseService.withWriteLock(async () => {
          await db.withTransactionAsync(async () => {
            for (const msgId of syncData.deleted) {
              // update local DB to mark as deleted for everyone
              await db.runAsync(
                `UPDATE messages SET is_deleted = 1, text = 'This message was deleted' WHERE server_id = ? OR local_id = ?`,
                [msgId, msgId]
              );
              await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [msgId]);
            }
          });
        });
      }
      
      this.notifyObservers(channelId);
    }
    return syncData;
  }

  /**
   * Initial load for a channel: tries to fetch from API and save to DB 
   * if we are not using the sync endpoint yet.
   */
  async fetchAndCacheRemoteMessages(channelId: string, after?: string): Promise<Message[]> {
    const remoteMessages = await this.remoteDataSource.getMessages(channelId, after);
    if (remoteMessages.length > 0) {
      await this.localDataSource.saveMessagesBatch(remoteMessages);
      this.notifyObservers(channelId);
    }
    return remoteMessages;
  }

  async clearChannel(channelId: string): Promise<void> {
    console.log("Repository clear:", channelId);
    await this.localDataSource.clearChannel(channelId);
    console.log("SQLite cleared");
    this.notifyObservers(channelId);
  }

  async toggleMessagesStar(messageIds: string[], channelId: string, isStarred: boolean): Promise<void> {
    await this.localDataSource.toggleMessagesStar(messageIds, channelId, isStarred);
    this.notifyObservers(channelId);
  }

  async getStarredMessagesSnapshot(): Promise<ConversationSnapshot> {
    const messages = await this.localDataSource.getStarredMessages();
    return {
      messages,
      attachments: messages.flatMap(m => m.attachments || []),
      reactions: messages.flatMap(m => m.reactions || []),
      mentions: messages.flatMap(m => m.mentions || []),
    };
  }
}

export const messageRepository = new MessageRepository();
