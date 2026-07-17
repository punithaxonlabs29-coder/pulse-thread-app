import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { CONFIG } from "../constants/config";
import { Message } from "../types/connects";
import { SessionService } from '../services/session.service';
import { syncEngine, syncEventBus } from '../services/sync.engine';
import { backgroundWorker } from '../services/background.worker';
import { connectionManager } from "../services/connection.manager";
import { typingManager } from "../services/typing.manager";

interface ChatContextType {
  broadcastDeleteEvent: (channelId: string, messageId: string) => void;
  connectChannels: (channelIds: string[]) => void;
  registerMembers: (channels: any[]) => void;
  lastUpdatedMessage: Message | null;
  lastPinnedEvent: { channelId: string; messageId: string; isPinned: boolean } | null;
  unreadCounts: Record<string, number>;
  readReceipts: Record<string, string>;
  resetUnreadCount: (channelId: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastUpdatedMessage, setLastUpdatedMessage] = useState<Message | null>(null);
  const [lastPinnedEvent, setLastPinnedEvent] = useState<{ channelId: string; messageId: string; isPinned: boolean } | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const memberNamesRef = useRef<Record<string, string>>({});
  const userRef = useRef<{email: string, name: string} | null>(null);

  useEffect(() => {
    SessionService.getUser().then(user => {
      if (user) {
        userRef.current = {
          email: user.email_id.toLowerCase(),
          name: user.first_name || user.email_id
        };
      }
    });

    connectionManager.setMessageHandler((channelId, data) => {
      if (data.event === "message_created" && data.message) {
        let msg = data.message;
        let is_forwarded = msg.is_forwarded;
        let text = msg.text || '';
        if (text.startsWith('[FWD] ')) {
          is_forwarded = true;
          text = text.substring(6);
        }
        msg = { ...msg, text, is_forwarded };
        
        syncEngine.handleIncomingMessage(channelId, msg);

        if (userRef.current && msg.sender_email.toLowerCase() !== userRef.current.email) {
          setUnreadCounts(prev => ({ ...prev, [channelId]: (prev[channelId] || 0) + 1 }));
        }
        setLastUpdatedMessage(msg);
      } else if (data.event === "message_updated" && data.message) {
        let updatedMsg = data.message;
        syncEngine.handleMessageUpdate(channelId, updatedMsg);
        setLastUpdatedMessage(updatedMsg);
      } else if (data.event === "typing_indicator") {
        typingManager.handleIncomingTyping(channelId, data, memberNamesRef.current, userRef.current?.email);
      } else if (data.event === "message_pinned_updated") {
        setLastPinnedEvent({
          channelId: data.channel_id,
          messageId: data.message_id,
          isPinned: data.is_pinned
        });
      } else if (data.event === "read_receipt_updated") {
        if (userRef.current && data.user_email?.toLowerCase() !== userRef.current.email) {
          setReadReceipts(prev => ({ ...prev, [channelId]: data.message_id }));
        }
      } else if (data.event === "message_deleted") {
        syncEngine.handleMessageDelete(channelId, data.message_id);
        setLastUpdatedMessage({
          message_id: data.message_id,
          channel_id: channelId,
          is_deleted: true,
          text: "This message was deleted",
          attachments: [],
          reactions: [],
          sender_email: "",
          sender_name: "",
          created_at: new Date().toISOString()
        });
      } else if (data.event === "channel_updated" && data.channel) {
        syncEventBus.emit('channel_updated', data.channel);
      }
    });

    return () => {
      connectionManager.disconnectAll();
    };
  }, []);

  const registerMembers = useCallback((channels: any[]) => {
    const initialUnread: Record<string, number> = {};
    channels.forEach(channel => {
      initialUnread[channel.channel_id] = channel.unread_count || 0;
      if (channel.members) {
        channel.members.forEach((member: any) => {
          if (member.email && member.name) {
            memberNamesRef.current[member.email.toLowerCase()] = member.name;
          }
        });
      }
    });
    setUnreadCounts(prev => ({ ...prev, ...initialUnread }));
  }, []);

  const connectChannels = useCallback((channelIds: string[]) => {
    connectionManager.connectChannels(channelIds);
  }, []);

  const broadcastDeleteEvent = useCallback((channelId: string, messageId: string) => {
    const ws = connectionManager.getSocket(channelId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: "message_deleted",
        message_id: messageId
      }));
    }
  }, []);

  const resetUnreadCount = useCallback((channelId: string) => {
    setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }));
  }, []);

  return (
    <ChatContext.Provider value={{ 
      connectChannels, 
      registerMembers, 
      lastUpdatedMessage,
      lastPinnedEvent,
      unreadCounts,
      readReceipts,
      resetUnreadCount,
      broadcastDeleteEvent
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatContext must be used within ChatProvider");
  return context;
};
