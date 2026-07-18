import { Message } from '../types/connects';
import { messageRepository } from './message.repository';
import { DatabaseService } from './database.service';

type Listener = (event: string, data: any) => void;

class EventBus {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== callback);
  }

  emit(event: string, data: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => callback(event, data));
  }
}

export const syncEventBus = new EventBus();

class SyncEngine {
  /**
   * Handle an incoming message from WebSockets or FCM.
   * 1. Save to local SQLite database
   * 2. Emit an event so the UI (chat.tsx) can update immediately
   */
  async handleIncomingMessage(channelId: string, message: Message) {
    // Save to local SQLite database immediately
    await messageRepository.saveMessageLocal(message);

    // Broadcast the new message event for UI
    syncEventBus.emit(`new_message_${channelId}`, message);
    
    // Also broadcast globally if we need it for badges, etc.
    syncEventBus.emit(`new_message`, { channelId, message });
  }

  async handleMessageUpdate(channelId: string, message: Message) {
    await messageRepository.saveMessageLocal(message);
    syncEventBus.emit(`update_message_${channelId}`, message);
  }

  async handleMessageDelete(channelId: string, messageId: string) {
    try {
      await messageRepository.markMessageDeletedLocal(messageId, channelId);
    } catch (e) {
      console.log("Error deleting message locally", e);
    }
    
    syncEventBus.emit(`delete_message_${channelId}`, messageId);
  }

  async handleReaction(channelId: string, messageId: string, reactions: any[]) {
    // Just emit for UI update
    syncEventBus.emit(`reactions_update_${channelId}`, { messageId, reactions });
  }
}

export const syncEngine = new SyncEngine();
