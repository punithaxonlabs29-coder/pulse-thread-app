import { Message } from '../types/connects';
import { DatabaseService } from './database.service';

export class MessageLocalDataSource {

  /**
   * Save a single message without its own transaction.
   * Callers that loop over this must wrap the loop in withWriteLock themselves.
   */
  async saveMessage(msg: Message): Promise<void> {
    const db = DatabaseService.getDB();
    const localId = msg.local_id || msg.message_id;

    await DatabaseService.withWriteLock(async () => {
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
        await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [localId]);
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

      if (msg.mentions !== undefined) {
        await db.runAsync(`DELETE FROM message_mentions WHERE message_id = ?`, [localId]);
        for (let i = 0; i < msg.mentions.length; i++) {
          const m = msg.mentions[i];
          const mentionId = m.id || `${localId}_mention_${i}`;
          await db.runAsync(`
            INSERT OR REPLACE INTO message_mentions (id, message_id, user_id, display_name, start_index, end_index, mention_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [mentionId, localId, m.user_id, m.display_name, m.start_index, m.end_index, m.mention_type || 'USER']);
        }
      }
    });
  }

  /**
   * Save multiple messages under a single serialised write lock.
   * All operations are batched inside one transaction.
   */
  async saveMessagesBatch(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const db = DatabaseService.getDB();

    // Pre-fetch server_id → local_id map BEFORE opening the write transaction.
    // Doing a SELECT inside withTransactionAsync causes a deadlock in expo-sqlite.
    const serverIds = messages.map(m => m.message_id).filter(Boolean) as string[];
    const localIdMap: Record<string, string> = {};
    if (serverIds.length > 0) {
      const placeholders = serverIds.map(() => '?').join(',');
      const rows = await db.getAllAsync<{ local_id: string; server_id: string }>(
        `SELECT local_id, server_id FROM messages WHERE server_id IN (${placeholders})`,
        serverIds
      );
      for (const row of rows) {
        localIdMap[row.server_id] = row.local_id;
      }
    }

    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        for (const msg of messages) {
          // Use existing local_id if this server_id already has a local row
          const localId = (msg.message_id && localIdMap[msg.message_id])
            ? localIdMap[msg.message_id]
            : (msg.local_id || msg.message_id);

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
            await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [localId]);
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

          if (msg.mentions !== undefined) {
            await db.runAsync(`DELETE FROM message_mentions WHERE message_id = ?`, [localId]);
            for (let i = 0; i < msg.mentions.length; i++) {
              const m = msg.mentions[i];
              const mentionId = m.id || `${localId}_mention_${i}`;
              await db.runAsync(`
                INSERT OR REPLACE INTO message_mentions (id, message_id, user_id, display_name, start_index, end_index, mention_type)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [mentionId, localId, m.user_id, m.display_name, m.start_index, m.end_index, m.mention_type || 'USER']);
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

    return this.mapRowsToMessages(rows);
  }

  async getMessage(messageId: string): Promise<Message | null> {
    const db = DatabaseService.getDB();
    const rows = await db.getAllAsync<any>(`
      SELECT * FROM messages
      WHERE server_id = ? OR local_id = ?
      LIMIT 1
    `, [messageId, messageId]);

    const messages = await this.mapRowsToMessages(rows);
    return messages.length > 0 ? messages[0] : null;
  }

  private async mapRowsToMessages(rows: any[]): Promise<Message[]> {
    if (rows.length === 0) return [];
    const db = DatabaseService.getDB();

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
    const allMentions = await db.getAllAsync<any>(
      `SELECT * FROM message_mentions WHERE message_id IN (${placeholders})`,
      [...messageIds]
    );
    const allStars = await db.getAllAsync<any>(
      `SELECT message_id FROM starred_messages WHERE message_id IN (${placeholders})`,
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

    const mentionsByMsg = allMentions.reduce((acc, m) => {
      if (!acc[m.message_id]) acc[m.message_id] = [];
      acc[m.message_id].push({
        id: m.id,
        user_id: m.user_id,
        display_name: m.display_name,
        start_index: m.start_index,
        end_index: m.end_index,
        mention_type: m.mention_type
      });
      return acc;
    }, {} as Record<string, any[]>);

    const starredMsgIds = new Set(allStars.map(s => s.message_id));

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
      mentions: (mentionsByMsg[row.local_id] || []).length > 0 ? mentionsByMsg[row.local_id] : undefined,
      is_starred: starredMsgIds.has(row.local_id) || (row.server_id ? starredMsgIds.has(row.server_id) : false),
    }));
  }

  async deleteMessage(messageId: string): Promise<void> {
    const db = DatabaseService.getDB();
    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        await db.runAsync(`DELETE FROM messages WHERE local_id = ? OR server_id = ?`, [messageId, messageId]);
        await db.runAsync(`DELETE FROM attachments WHERE message_id = ?`, [messageId]);
        await db.runAsync(`DELETE FROM reactions WHERE message_id = ?`, [messageId]);
        await db.runAsync(`DELETE FROM message_mentions WHERE message_id = ?`, [messageId]);
        await db.runAsync(`DELETE FROM starred_messages WHERE message_id = ?`, [messageId]);
      });
    });
  }

  async toggleMessagesStar(messageIds: string[], channelId: string, isStarred: boolean): Promise<void> {
    const db = DatabaseService.getDB();
    console.log("TOGGLE STAR:", messageIds, channelId, isStarred);
    await DatabaseService.withWriteLock(async () => {
      await db.withTransactionAsync(async () => {
        if (isStarred) {
          const now = Date.now();
          for (const msgId of messageIds) {
            console.log("INSERT STAR:", msgId);
            await db.runAsync(
              `INSERT OR REPLACE INTO starred_messages (message_id, channel_id, starred_at, sync_state) VALUES (?, ?, ?, 'LOCAL')`,
              [msgId, channelId, now]
            );
          }
        } else {
          const placeholders = messageIds.map(() => '?').join(',');
          console.log("DELETE STAR:", messageIds);
          await db.runAsync(
            `DELETE FROM starred_messages WHERE message_id IN (${placeholders})`,
            messageIds
          );
        }
      });
    });
  }

  async getStarredMessages(): Promise<Message[]> {
    const db = DatabaseService.getDB();
    const rows = await db.getAllAsync<any>(`
      SELECT m.* 
      FROM starred_messages s
      JOIN messages m ON s.message_id = m.local_id OR s.message_id = m.server_id
      ORDER BY s.starred_at DESC
    `);
    console.log("STARRED ROWS:", rows.length);
    
    return this.mapRowsToMessages(rows.reverse());
  }

  async clearChannel(channelId: string): Promise<void> {
    const db = DatabaseService.getDB();

    await DatabaseService.withWriteLock(async () => {
      const before = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM messages WHERE channel_id = ?",
        [channelId]
      );

      console.log("BEFORE DELETE:", before);

      const result = await db.runAsync(
        "DELETE FROM messages WHERE channel_id = ?",
        [channelId]
      );

      console.log("DELETE RESULT:", result);

      const after = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM messages WHERE channel_id = ?",
        [channelId]
      );
    });

  console.log("AFTER DELETE:", after);
}
}
