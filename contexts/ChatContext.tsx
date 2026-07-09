import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { CONFIG } from "../constants/config";
import { Message } from "../types/connects";
import { SessionService } from '../services/session.service';

interface ChatContextType {
  typingState: Record<string, Set<string>>;
  sendTypingStatus: (channelId: string, isTyping: boolean) => void;
  connectChannels: (channelIds: string[]) => void;
  registerMembers: (channels: any[]) => void;
  lastMessages: Record<string, Message>;
  unreadCounts: Record<string, number>;
  readReceipts: Record<string, string>;
  resetUnreadCount: (channelId: string) => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [typingState, setTypingState] = useState<Record<string, Set<string>>>({});
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [readReceipts, setReadReceipts] = useState<Record<string, string>>({});
  const socketsRef = useRef<Record<string, WebSocket>>({});
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
    channelIds.forEach(channelId => {
      if (!socketsRef.current[channelId]) {
        connect(channelId);
      }
    });
  }, []);

  const connect = (channelId: string) => {
    const wsUrl = `${CONFIG.WS_BASE_URL}connects/${channelId}/`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      socketsRef.current[channelId] = ws;
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "message_created" && data.message) {
          setLastMessages(prev => ({ ...prev, [channelId]: data.message }));
          // If the message is not from the current user, increment unread
          if (userRef.current && data.message.sender_email.toLowerCase() !== userRef.current.email) {
            setUnreadCounts(prev => ({ ...prev, [channelId]: (prev[channelId] || 0) + 1 }));
          }
        } else if (data.event === "typing_indicator") {
          const userEmail = data.user_email;
          const resolvedName = memberNamesRef.current[userEmail.toLowerCase()] || data.user_name || userEmail;
          
          if (userRef.current && userEmail.toLowerCase() !== userRef.current.email) {
            setTypingState(prev => {
              const channelTyping = prev[channelId] ? new Set(prev[channelId]) : new Set<string>();
              if (data.is_typing) {
                channelTyping.add(resolvedName);
              } else {
                channelTyping.delete(resolvedName);
              }
              return { ...prev, [channelId]: channelTyping };
            });
          }
        } else if (data.event === "read_receipt_updated") {
          if (userRef.current && data.user_email?.toLowerCase() !== userRef.current.email) {
            setReadReceipts(prev => ({ ...prev, [channelId]: data.message_id }));
          }
        }
      } catch (error) {}
    };

    ws.onclose = () => {
      delete socketsRef.current[channelId];
      setTimeout(() => connect(channelId), 3000);
    };
  };

  const sendTypingStatus = useCallback((channelId: string, isTyping: boolean) => {
    const ws = socketsRef.current[channelId];
    if (ws && ws.readyState === WebSocket.OPEN && userRef.current) {
      ws.send(JSON.stringify({
        event: "typing_indicator",
        user_email: userRef.current.email,
        user_name: userRef.current.name,
        is_typing: isTyping
      }));
    }
  }, []);

  const resetUnreadCount = useCallback((channelId: string) => {
    setUnreadCounts(prev => ({ ...prev, [channelId]: 0 }));
  }, []);

  return (
    <ChatContext.Provider value={{ 
      typingState, 
      sendTypingStatus, 
      connectChannels, 
      registerMembers, 
      lastMessages,
      unreadCounts,
      readReceipts,
      resetUnreadCount 
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
