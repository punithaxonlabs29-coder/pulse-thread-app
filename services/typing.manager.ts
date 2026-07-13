import { connectionManager } from './connection.manager';

type TypingListener = (users: Set<string>) => void;

class TypingManager {
  // state: channelId -> set of typing usernames
  private state: Record<string, Set<string>> = {};
  
  // listeners: channelId -> array of callback functions
  private listeners: Record<string, TypingListener[]> = {};

  public subscribe(channelId: string, listener: TypingListener): () => void {
    if (!this.listeners[channelId]) {
      this.listeners[channelId] = [];
    }
    this.listeners[channelId].push(listener);
    
    // Immediately emit current state to new listener
    listener(this.state[channelId] || new Set<string>());

    return () => {
      this.listeners[channelId] = this.listeners[channelId].filter(l => l !== listener);
    };
  }

  private emit(channelId: string) {
    const channelListeners = this.listeners[channelId];
    if (channelListeners && channelListeners.length > 0) {
      const channelState = this.state[channelId] || new Set<string>();
      channelListeners.forEach(listener => listener(channelState));
    }
  }

  public handleIncomingTyping(channelId: string, data: any, memberNames: Record<string, string>, currentUserEmail?: string) {
    const userEmail = data.user_email;
    const resolvedName = memberNames[userEmail.toLowerCase()] || data.user_name || userEmail;
    
    // Don't register our own typing status
    if (currentUserEmail && userEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      return;
    }

    if (!this.state[channelId]) {
      this.state[channelId] = new Set<string>();
    }

    const channelTyping = this.state[channelId];
    if (data.is_typing) {
      channelTyping.add(resolvedName);
    } else {
      channelTyping.delete(resolvedName);
    }
    
    this.emit(channelId);
  }

  public broadcastTyping(channelId: string, isTyping: boolean, userEmail: string, userName: string) {
    const ws = connectionManager.getSocket(channelId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: "typing_indicator",
        user_email: userEmail,
        user_name: userName,
        is_typing: isTyping
      }));
    }
  }
}

export const typingManager = new TypingManager();
