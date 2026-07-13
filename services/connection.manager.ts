import { CONFIG } from '../constants/config';
import { backgroundWorker } from './background.worker';

type MessageHandler = (channelId: string, eventData: any) => void;

class ConnectionManager {
  private sockets: Record<string, WebSocket> = {};
  private onMessageHandler: MessageHandler | null = null;

  public setMessageHandler(handler: MessageHandler) {
    this.onMessageHandler = handler;
  }

  public getSocket(channelId: string): WebSocket | undefined {
    return this.sockets[channelId];
  }

  public connectChannels(channelIds: string[]) {
    channelIds.forEach(channelId => {
      if (!this.sockets[channelId]) {
        this.connect(channelId);
      }
    });
  }

  public disconnectAll() {
    Object.values(this.sockets).forEach(ws => ws.close());
    this.sockets = {};
  }

  private connect(channelId: string) {
    const wsUrl = `${CONFIG.WS_BASE_URL}connects/${channelId}/`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`[WebSocket] Connected to channel: ${channelId}`);
      this.sockets[channelId] = ws;
      
      // Trigger background queue retry instantly upon successful connection
      backgroundWorker.forceRetry();
    };

    ws.onerror = (error) => {
      console.log(`[WebSocket] Error on channel ${channelId}:`, error);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Closed on channel ${channelId}. Code: ${event.code}, Reason: ${event.reason}`);
      delete this.sockets[channelId];
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessageHandler) {
          this.onMessageHandler(channelId, data);
        }
      } catch (err) {
        console.error(`[WebSocket] Error parsing message on channel ${channelId}:`, err);
      }
    };
  }
}

export const connectionManager = new ConnectionManager();
