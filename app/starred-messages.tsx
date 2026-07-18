import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, FlatList, TouchableOpacity, SafeAreaView, Platform, ToastAndroid, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '../components/ui/AppText';
import { useColors } from '../design';
import { Message, ConversationSnapshot } from '../types/connects';
import { messageRepository } from '../services/message.repository';
import MessageBubble from '../components/MessageBubble';
import { ConnectsService } from '../services/connects.service';
import { formatTimeOnly, formatDateHeader } from '../utils/date';

export default function StarredMessagesScreen() {
  const router = useRouter();
  const colors = useColors();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Reuse same selected logic as chat
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleItems(new Set(viewableItems.map((v: any) => v.item.message_id)));
  });
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });

  useEffect(() => {
    const unsubscribe = messageRepository.observeStarred((snapshot: ConversationSnapshot) => {
      // getStarredMessagesSnapshot returns messages ordered by starred_at DESC
      setMessages(snapshot.messages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLongPress = (messageId: string) => {
    setSelectedMessageIds(prev => {
      if (prev.includes(messageId)) return prev;
      return [...prev, messageId];
    });
  };

  const handlePress = (message: Message) => {
    if (selectedMessageIds.length > 0) {
      setSelectedMessageIds(prev =>
        prev.includes(message.message_id)
          ? prev.filter(id => id !== message.message_id)
          : [...prev, message.message_id]
      );
    } else {
      // Jump to message
      router.push({
        pathname: '/chat',
        params: {
          channelId: message.channel_id,
          scrollToMessageId: message.message_id,
        }
      });
    }
  };

  const handleUnstarSelected = async () => {
    try {
      // All selected messages might belong to different channels.
      // But toggleMessagesStar takes one channel_id.
      // Wait, toggleMessagesStar doesn't really need channelId for DELETE if it just deletes by message_id!
      // But for inserting, it does. Since we are UNSTARRING here, we can just group by channel_id or the backend can handle it.
      // We pass an empty string for channelId if we are just deleting.
      await messageRepository.toggleMessagesStar(selectedMessageIds, "", false);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Messages unstarred', ToastAndroid.SHORT);
      }
      setSelectedMessageIds([]);
    } catch (e) {
      console.error("Error unstarring messages:", e);
    }
  };

  // Precompute view data like chat.tsx
  const displayData = useMemo(() => {
    // For starred messages, we don't necessarily group by date, or we group by starred date.
    // Let's just group by the message created_at date for now to show context.
    const mapped = messages.map((item, index) => {
      const timeStr = formatTimeOnly(item.created_at);
      const currentDateStr = formatDateHeader(item.created_at);
      const olderDateStr = messages[index + 1] ? formatDateHeader(messages[index + 1].created_at) : null;
      const showDateHeader = currentDateStr !== olderDateStr;

      // Extract emojis like chat.tsx (simplified here)
      const hasText = item.text && item.text.trim().length > 0;
      const isSingleEmoji = false;
      const isMediumEmoji = false;
      const isSmallEmoji = false;

      return {
        ...item,
        timeStr,
        currentDateStr,
        showDateHeader,
        showTail: true, // Always show tail to look like standalone bubbles
        isSingleEmoji,
        isMediumEmoji,
        isSmallEmoji
      };
    });
    return mapped;
  }, [messages]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      {selectedMessageIds.length > 0 ? (
        <View style={[styles.header, { backgroundColor: colors.brand.primary }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setSelectedMessageIds([])} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
            <AppText style={[styles.title, { color: colors.text.inverse, marginLeft: 16 }]}>
              {selectedMessageIds.length}
            </AppText>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleUnstarSelected} style={styles.iconButton}>
              <Ionicons name="star" size={22} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <AppText style={[styles.title, { color: colors.text.primary, marginLeft: 16 }]}>
              Starred Messages
            </AppText>
          </View>
        </View>
      )}

      {/* List */}
      <FlatList
        ref={flatListRef}
        data={displayData}
        keyExtractor={item => item.message_id}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={viewabilityConfig.current}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="star" size={64} color={colors.text.muted} style={{ marginBottom: 16 }} />
              <AppText style={[styles.emptyText, { color: colors.text.secondary }]}>
                No starred messages yet.
              </AppText>
              <AppText style={[styles.emptySubText, { color: colors.text.muted }]}>
                Long-press a message and tap ⭐.
              </AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.messageRow}>
            {/* Context Header: Who sent it and where */}
            <View style={styles.contextHeader}>
              <AppText variant="caption" style={{ color: colors.text.secondary, fontWeight: 'bold' }}>
                {item.sender_name || item.sender_email}
              </AppText>
              <AppText variant="caption" style={{ color: colors.text.muted }}>
                {' • '}
                {formatDateHeader(item.created_at)}
              </AppText>
            </View>
            <MessageBubble
              messageId={item.message_id}
              text={item.text}
              attachments={item.attachments || []}
              time={item.timeStr}
              isMine={false} // Force all to left side for uniform list
              showTail={item.showTail}
              readStatus={undefined}
              isVisible={visibleItems.has(item.message_id)}
              reactions={item.reactions}
              replyTo={item.reply_to}
              isForwarded={item.is_forwarded}
              isDeleted={item.is_deleted}
              mentions={item.mentions || []}
              isSingleEmoji={item.isSingleEmoji}
              isMediumEmoji={item.isMediumEmoji}
              isSmallEmoji={item.isSmallEmoji}
              isStarred={item.is_starred}
              selected={selectedMessageIds.includes(item.message_id)}
              onLongPress={() => handleLongPress(item.message_id)}
              onPress={() => handlePress(item as unknown as Message)}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  iconButton: {
    padding: 8,
  },
  messageRow: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  contextHeader: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
  },
});
