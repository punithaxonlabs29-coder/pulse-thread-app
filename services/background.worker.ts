import { DatabaseService } from './database.service';
import { ConnectsService } from './connects.service';
import { messageRepository } from './message.repository';

class BackgroundWorker {
  private isProcessing = false;

  start() {
    // Run every 10 seconds in the background
    setInterval(() => {
      this.processQueue();
    }, 10000);
    
    // Also process immediately on start
    this.processQueue();
  }

  async enqueueMessage(localId: string, channelId: string, payload: any) {
    const db = DatabaseService.getDB();
    await DatabaseService.withWriteLock(async () => {
      await db.runAsync(`
        INSERT OR REPLACE INTO pending_queue (local_id, channel_id, payload, retry_count, status)
        VALUES (?, ?, ?, ?, ?)
      `, [localId, channelId, JSON.stringify(payload), 0, 'pending']);
    });
    
    // Trigger processing immediately when something is added
    this.processQueue();
  }

  public forceRetry() {
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const db = DatabaseService.getDB();
      const pendingItems = await db.getAllAsync<any>(`
        SELECT * FROM pending_queue WHERE status = 'pending' OR status = 'failed'
      `);

      for (const item of pendingItems) {
        // If it failed more than 5 times, give up for now (or backoff)
        if (item.retry_count >= 5) continue;

        try {
          const payload = JSON.parse(item.payload);
          const response = await ConnectsService.sendMessage(
            item.channel_id, 
            payload.text, 
            payload.attachments, 
            payload.replyId,
            payload.isForwarded,
            item.local_id
          );

          if (response && response.created_message) {
            // Success! Remove from queue
            await DatabaseService.withWriteLock(async () => {
              await db.runAsync(`DELETE FROM pending_queue WHERE local_id = ?`, [item.local_id]);
            });

            // Update the actual message in SQLite via a targeted UPDATE (preserving any offline local mutations)
            await messageRepository.promotePendingMessageLocal(item.local_id, response.created_message, item.channel_id);
            
            // Broadcast event if UI needs to update (SyncEngine handles this typically)
          }
        } catch (err) {
          console.log(`Failed to process message ${item.local_id}, retrying later`, err);
          
          // Increment retry count
          await DatabaseService.withWriteLock(async () => {
            await db.runAsync(`
              UPDATE pending_queue SET retry_count = retry_count + 1, status = 'failed'
              WHERE local_id = ?
            `, [item.local_id]);
          });

          // Exhaust budget check: update UI to failed if retries are up
          if (item.retry_count + 1 >= 5) {
            await messageRepository.updateMessageStatusLocal(item.local_id, 'failed', item.channel_id);
          }
        }
      }
    } catch (error) {
      console.error("Error processing background queue:", error);
    } finally {
      this.isProcessing = false;
    }
  }
}

export const backgroundWorker = new BackgroundWorker();
