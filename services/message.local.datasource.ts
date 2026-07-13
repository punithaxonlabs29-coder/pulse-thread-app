import { DatabaseService } from './database.service';
import { Message, Reaction } from '../types/connects';

export class MessageLocalDataSource {
  async saveMessage(msg: Message): Promise<void> {
    const db = DatabaseService.getDB();
    
    // We use local_id if available, otherwise server ID
    const localId = msg.local_id || msg.message_id;
    
    await db.withTransactionAsync(async () => {
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
          // Generating an ID for attachment if it doesn't exist
          const attId = att.id || `${localId}_${att.name}`;
          await db.runAsync(`
            INSERT OR REPLACE INTO attachments
            (id, message_id, type, name, url, file_url, size, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            attId,
            localId,
            att.type || 'file',
            att.name || '',
            att.url || '',
            att.file_url || '',
            att.size || 0,
            att.duration || 0
          ]);
        }
      }

      if (msg.reactions !== undefined) {
        // Wipe existing reactions for this message to prevent orphaned deletions
        await db.runAsync(`DELETE FROM reactions WHERE message_id = ?`, [localId]);
        
        if (msg.reactions.length > 0) {
          for (const reaction of msg.reactions) {
            const reactionId = `${localId}_${reaction.emoji}`;
            await db.runAsync(`
              INSERT OR REPLACE INTO reactions
              (id, message_id, emoji, count, user_reacted)
              VALUES (?, ?, ?, ?, ?)
            `, [
              reactionId,
              localId,
              reaction.emoji,
              reaction.count,
              reaction.user_reacted ? 1 : 0
            ]);
          }
        }
      }
    });
  }

  async saveMessagesBatch(messages: Message[]): Promise<void> {
    const db = DatabaseService.getDB();
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
          if (msg.reactions.length > 0) {
            for (const reaction of msg.reactions) {
              const reactionId = `${localId}_${reaction.emoji}`;
              await db.runAsync(`
                INSERT OR REPLACE INTO reactions
                (id, message_id, emoji, count, user_reacted)
                VALUES (?, ?, ?, ?, ?)
              `, [
                reactionId, localId, reaction.emoji, reaction.count, reaction.user_reacted ? 1 : 0
              ]);
            }
          }
        }
      }
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

    const messages: Message[] = [];
    if (rows.length === 0) return messages;

    // Reverse to chronological order after fetching descending
    const chronologicalRows = rows.reverse();

    // Extract all message IDs for batch querying
    const messageIds = chronologicalRows.map(r => r.local_id);
    const placeholders = messageIds.map(() => '?').join(',');

    // Batch fetch all attachments and reactions for these messages
    const allAttachments = await db.getAllAsync<any>(`
      SELECT * FROM attachments WHERE message_id IN (${placeholders})
    `, [...messageIds]);

    const allReactions = await db.getAllAsync<any>(`
      SELECT * FROM reactions WHERE message_id IN (${placeholders})
    `, [...messageIds]);

    // Group attachments by message_id
    const attachmentsByMsg = allAttachments.reduce((acc, att) => {
      if (!acc[att.message_id]) acc[att.message_id] = [];
      acc[att.message_id].push(att);
      return acc;
    }, {});

    // Group reactions by message_id
    const reactionsByMsg = allReactions.reduce((acc, r) => {
      if (!acc[r.message_id]) acc[r.message_id] = [];
      acc[r.message_id].push({
        emoji: r.emoji,
        count: r.count,
        user_reacted: r.user_reacted === 1
      });
      return acc;
    }, {});

    for (const row of chronologicalRows) {
      const attachments = attachmentsByMsg[row.local_id] || [];
      const reactions = reactionsByMsg[row.local_id] || [];

      messages.push({
        local_id: row.local_id,
        message_id: row.server_id || row.local_id, // Fallback to local if no server_id
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
        attachments: attachments.length > 0 ? attachments : undefined,
        reactions: reactions.length > 0 ? reactions : undefined
      });
    }

    return messages;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const db = DatabaseService.getDB();
    
    // Delete from messages table (cascade should handle attachments/reactions if configured, 
    // but SQLite on RN without foreign_keys PRAGMA ON might not cascade, so let's manually delete)
    await db.runAsync(`DELETE FROM reactions WHERE message_id = ?;`, [messageId]);
    await db.runAsync(`DELETE FROM attachments WHERE message_id = ?;`, [messageId]);
    await db.runAsync(`DELETE FROM messages WHERE server_id = ? OR local_id = ?;`, [messageId, messageId]);
  }
}
