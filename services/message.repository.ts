import { Message } from '../types/connects';
import { MessageLocalDataSource } from './message.local.datasource';
import { MessageRemoteDataSource } from './message.remote.datasource';
import { ConnectsService } from './connects.service';
import { DatabaseService } from './database.service';

export class MessageRepository {
  private localDataSource: MessageLocalDataSource;
  private remoteDataSource: MessageRemoteDataSource;

  constructor() {
    this.localDataSource = new MessageLocalDataSource();
    this.remoteDataSource = new MessageRemoteDataSource();
  }

  /**
   * Fetch messages for a channel. 
   * This immediately returns local data, but also can trigger a remote fetch if needed.
   */
  async getMessages(channelId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return this.localDataSource.getMessages(channelId, limit, offset);
  }

  /**
   * Save a single message locally
   */
  async saveMessageLocal(message: Message): Promise<void> {
    await this.localDataSource.saveMessage(message);
  }

  /**
   * Delete a message locally
   */
  async deleteMessageLocal(messageId: string): Promise<void> {
    await this.localDataSource.deleteMessage(messageId);
  }

  /**
   * Trigger a sync with the remote backend for this channel
   */
  async syncChannelMessages(channelId: string, lastSync?: string, lastMessageId?: string): Promise<any> {
    const syncData = await ConnectsService.syncMessages(channelId, lastSync, lastMessageId);
    
    if (syncData && syncData.status) {
      // 1. Save new messages
      if (syncData.new) {
        for (const msg of syncData.new) {
          await this.localDataSource.saveMessage(msg);
        }
      }
      // 2. Update existing messages
      if (syncData.updated) {
        for (const msg of syncData.updated) {
          await this.localDataSource.saveMessage(msg);
        }
      }
      // 3. Process deletions
      if (syncData.deleted) {
        for (const msgId of syncData.deleted) {
           // update local DB to mark as deleted for everyone
           const db = DatabaseService.getDB();
           await db.runAsync(
             `UPDATE messages SET is_deleted = 1, text = 'This message was deleted' WHERE server_id = ? OR local_id = ?`,
             [msgId, msgId]
           );
           await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [msgId]);
        }
      }
    }
    return syncData;
  }

  /**
   * Initial load for a channel: tries to fetch from API and save to DB 
   * if we are not using the sync endpoint yet.
   */
  async fetchAndCacheRemoteMessages(channelId: string, after?: string): Promise<Message[]> {
    const remoteMessages = await this.remoteDataSource.getMessages(channelId, after);
    for (const msg of remoteMessages) {
      await this.localDataSource.saveMessage(msg);
    }
    return remoteMessages;
  }
}

export const messageRepository = new MessageRepository();
