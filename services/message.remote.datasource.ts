import { Message } from '../types/connects';
import { mainApi } from './api';
import { SessionService } from './session.service';

export interface SyncResponse {
  status: boolean;
  new: Message[];
  updated: Message[];
  deleted: string[];
  reactions: any[];
  has_more: boolean;
  server_time: string;
}

export class MessageRemoteDataSource {
  async getMessages(channelId: string, after?: string, before?: string, limit: number = 50, offset?: number): Promise<Message[]> {
    let url = `connects/messages/?channel_id=${channelId}&limit=${limit}&lightweight=true&t=${Date.now()}`;
    if (after) {
      url += `&after=${encodeURIComponent(after)}`;
    }
    if (before) {
      url += `&before=${encodeURIComponent(before)}`;
    }
    if (offset !== undefined) {
      url += `&offset=${offset}`;
    }
    
    const response = await mainApi.get(url);
    if (!response.data.status) return [];
    
    return this.mapResponseMessages(response.data.messages || []);
  }

  // The new incremental sync endpoint
  async syncMessages(channelId: string, lastSync?: string, lastMessageId?: string): Promise<SyncResponse | null> {
    try {
      const response = await mainApi.post('connects/messages/sync/', {
        channel_id: channelId,
        last_sync: lastSync,
        last_message_id: lastMessageId
      });
      
      if (response.data.status) {
        // Map the new and updated messages
        response.data.new = await this.mapResponseMessages(response.data.new || []);
        response.data.updated = await this.mapResponseMessages(response.data.updated || []);
        return response.data;
      }
      return null;
    } catch (error) {
      console.log('Sync API Error:', error);
      return null;
    }
  }

  private async mapResponseMessages(messages: any[]): Promise<Message[]> {
    const user = await SessionService.getUser();
    const userEmail = user?.email_id?.toLowerCase() || "";
    
    return messages.map(msg => {
      let is_forwarded = msg.is_forwarded;
      let text = msg.text || '';
      if (text.startsWith('[FWD] ')) {
        is_forwarded = true;
        text = text.substring(6);
      }
      
      const updatedMsg: Message = { ...msg, text, is_forwarded };

      if (updatedMsg.reactions && updatedMsg.reactions.length > 0) {
        updatedMsg.reactions = updatedMsg.reactions.map((r: any) => ({
          ...r,
          user_reacted: r.users?.some((u: any) => u.email?.toLowerCase() === userEmail) || false
        }));
      }
      
      return updatedMsg;
    });
  }
}
