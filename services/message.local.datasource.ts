import { DatabaseService } from './database.service';
import { Message } from '../types/connects';

export class MessageLocalDataSource {

  /**
   * Save a single message without its own transaction.
   * Callers that loop over this must wrap the loop in withWriteLock themselves.
   */
  async saveMessage(msg: Message): Promise<void> {
    const db = DatabaseService.getDB();
    const localId = msg.local_id || msg.message_id;

    await db.runAsync(`
      INSERT OR REPLACE INTO messages 
      (local_id, server_id, channel_id, sender_email, sender_name, text, status, 
       is_pinned, is_forwarded, is_edited, is_deleted, reply_to_id, reply_to_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      localId,
      msg.message_id || null,
      msg.channel_id,
      msg.sender_email,
      msg.sender_name,
      msg.text,
      msg.status || 'sent',
      msg.is_pinned ? 1 : 0,
      msg.is_forwarded ? 1 : 0,
      msg.is_edited ? 1 : 0,
      msg.is_deleted ? 1 : 0,
      msg.reply_to?.message_id || null,
      msg.reply_to ? JSON.stringify(msg.reply_to) : null,
      msg.created_at
    ]);

    if (msg.attachments && msg.attachments.length > 0) {
      for (const att of msg.attachments) {
        const attId = att.id || `${localId}_${att.name}`;
        await db.runAsync(`
          INSERT OR REPLACE INTO attachments
          (id, message_id, type, name, url, file_url, size, duration)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          attId, localId, att.type || 'file', att.name || '',
          att.url || '', att.file_url || '', att.size || 0, att.duration || 0
        ]);
      }
    }

    if (msg.reactions !== undefined) {
      await db.runAsync(`DELETE FROM reactions WHERE message_id = ?`, [localId]);
      for (const reaction of msg.reactions) {
        const reactionId = `${localId}_${reaction.emoji}`;
        await db.runAsync(`
          INSERT OR REPLACE INTO reactions (id, message_id, emoji, count, user_reacted)
          VALUES (?, ?, ?, ?, ?)
        `, [reactionId, localId, reaction.emoji, reaction.count, reaction.user_reacted ? 1 : 0]);
      }
    }
  }

  /**
   * Save multiple messages under a single serialised write lock.
   * All operations are batched inside one transaction.
   */
  async saveMessagesBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const db = DatabaseService.getDB();

    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        for (const msg of messages) {
          const localId = msg.local_id || msg.message_id;

          await db.runAsync(`
            INSERT OR REPLACE INTO messages 
            (local_id, server_id, channel_id, sender_email, sender_name, text, status, 
             is_pinned, is_forwarded, is_edited, is_deleted, reply_to_id, reply_to_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            localId,
            msg.message_id || null,
            msg.channel_id,
            msg.sender_email,
            msg.sender_name,
            msg.text,
            msg.status || 'sent',
            msg.is_pinned ? 1 : 0,
            msg.is_forwarded ? 1 : 0,
            msg.is_edited ? 1 : 0,
            msg.is_deleted ? 1 : 0,
            msg.reply_to?.message_id || null,
            msg.reply_to ? JSON.stringify(msg.reply_to) : null,
            msg.created_at
          ]);

          if (msg.attachments && msg.attachments.length > 0) {
            for (const att of msg.attachments) {
              const attId = att.id || `${localId}_${att.name}`;
              await db.runAsync(`
                INSERT OR REPLACE INTO attachments
                (id, message_id, type, name, url, file_url, size, duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                attId, localId, att.type || 'file', att.name || '',
                att.url || '', att.file_url || '', att.size || 0, att.duration || 0
              ]);
            }
          }

          if (msg.reactions !== undefined) {
            await db.runAsync(`DELETE FROM reactions WHERE message_id = ?`, [localId]);
            for (const reaction of msg.reactions) {
              const reactionId = `${localId}_${reaction.emoji}`;
              await db.runAsync(`
                INSERT OR REPLACE INTO reactions (id, message_id, emoji, count, user_reacted)
                VALUES (?, ?, ?, ?, ?)
              `, [reactionId, localId, reaction.emoji, reaction.count, reaction.user_reacted ? 1 : 0]);
            }
          }
        }
      });
    });
  }

  async getMessages(channelId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const db = DatabaseService.getDB();

    const rows = await db.getAllAsync<any>(`
      SELECT * FROM messages
      WHERE channel_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [channelId, limit, offset]);

    if (rows.length === 0) return [];

    const chronologicalRows = rows.reverse();
    const messageIds = chronologicalRows.map(r => r.local_id);
    const placeholders = messageIds.map(() => '?').join(',');

    const allAttachments = await db.getAllAsync<any>(
      `SELECT * FROM attachments WHERE message_id IN (${placeholders})`,
      [...messageIds]
    );
    const allReactions = await db.getAllAsync<any>(
      `SELECT * FROM reactions WHERE message_id IN (${placeholders})`,
      [...messageIds]
    );

    const attachmentsByMsg = allAttachments.reduce((acc, att) => {
      if (!acc[att.message_id]) acc[att.message_id] = [];
      acc[att.message_id].push(att);
      return acc;
    }, {} as Record<string, any[]>);

    const reactionsByMsg = allReactions.reduce((acc, r) => {
      if (!acc[r.message_id]) acc[r.message_id] = [];
      acc[r.message_id].push({ emoji: r.emoji, count: r.count, user_reacted: r.user_reacted === 1 });
      return acc;
    }, {} as Record<string, any[]>);

    return chronologicalRows.map(row => ({
      local_id: row.local_id,
      message_id: row.server_id || row.local_id,
      channel_id: row.channel_id,
      sender_email: row.sender_email,
      sender_name: row.sender_name,
      text: row.text,
      status: row.status,
      is_pinned: row.is_pinned === 1,
      is_forwarded: row.is_forwarded === 1,
      is_edited: row.is_edited === 1,
      is_deleted: row.is_deleted === 1,
      reply_to: row.reply_to_data ? JSON.parse(row.reply_to_data) : undefined,
      created_at: row.created_at,
      attachments: (attachmentsByMsg[row.local_id] || []).length > 0 ? attachmentsByMsg[row.local_id] : undefined,
      reactions: (reactionsByMsg[row.local_id] || []).length > 0 ? reactionsByMsg[row.local_id] : undefined,
    }));
  }

  async deleteMessage(messageId: string): Promise<void> {
    const db = DatabaseService.getDB();
    await DatabaseService.withWriteLock(async () => {
      await db.runAsync(`DELETE FROM reactions WHERE message_id = ?`, [messageId]);
      await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [messageId]);
      await db.runAsync(`DELETE FROM messages WHERE server_id = ? OR local_id = ?`, [messageId, messageId]);
    });
  }
}
