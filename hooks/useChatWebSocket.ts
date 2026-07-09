import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../constants/config";
import { Message } from "../types/connects";

interface UseChatWebSocketProps {
  channelId: string | undefined;
  currentUserEmail: string | undefined;
  onMessageReceived: (message: Message) => void;
  onTypingStatusChange: (userEmail: string, isTyping: boolean) => void;
  onReconnect: () => void;
}

export function useChatWebSocket({ channelId, currentUserEmail, onMessageReceived, onTypingStatusChange, onReconnect }: UseChatWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  const connect = () => {
    if (!channelId || !isComponentMounted.current) return;

    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${CONFIG.WS_BASE_URL}connects/${channelId}/`;
    console.log("Connecting to WebSocket:", wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      // If we just reconnected, trigger a fetch to get any missed messages
      onReconnect();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === "message_created" && data.message) {
          onMessageReceived(data.message as Message);
        } else if (data.event === "typing_indicator") {
          // Ignore our own typing events echoed back
          if (data.user_email !== currentUserEmail?.toLowerCase()) {
            onTypingStatusChange(data.user_email, data.is_typing);
          }
        }
      } catch (error) {
        console.log("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.log("WebSocket Error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
      wsRef.current = null;
      
      // Attempt to reconnect if component is still mounted
      if (isComponentMounted.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting WebSocket Reconnect...");
          connect();
        }, 3000); // 3 second reconnect delay
      }
    };
  };

  useEffect(() => {
    isComponentMounted.current = true;
    connect();

    return () => {
      isComponentMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [channelId]);

  const sendTypingStatus = (isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUserEmail) {
      wsRef.current.send(JSON.stringify({
        event: "typing_indicator",
        user_email: currentUserEmail,
        is_typing: isTyping
      }));
    }
  };

  return { isConnected, sendTypingStatus };
}
