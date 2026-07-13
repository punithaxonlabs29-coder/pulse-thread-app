import { useState, useEffect } from 'react';
import { typingManager } from '../services/typing.manager';

export function useTyping(channelId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to typing updates for this channel
    const unsubscribe = typingManager.subscribe(channelId, (users) => {
      setTypingUsers(new Set(users)); // clone to ensure React re-renders
    });

    // Cleanup when component unmounts or channelId changes
    return () => {
      unsubscribe();
    };
  }, [channelId]);

  return typingUsers;
}
