import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Text, ToastAndroid, TouchableOpacity, View, Modal, Share } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import type { FlashListRef, FlashListProps } from "@shopify/flash-list";

// Augment the FlashListProps to fix the missing estimatedItemSize type in v2.3.2
declare module "@shopify/flash-list" {
  interface FlashListProps<TItem> {
    estimatedItemSize?: number;
  }
}

import * as Clipboard from 'expo-clipboard';

import ChatHeader from "../components/ChatHeader";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import ReactionPicker from "../components/ReactionPicker";
import SelectionHeader from "../components/SelectionHeader";
import MessageInfo from "../components/MessageInfo";
import { CacheService } from "../services/cache.service";
import { ConnectsService } from "../services/connects.service";
import { SessionService } from "../services/session.service";
import NotificationService from "../services/notification.service";
import { Message } from "../types/connects";
import { formatDateHeader, formatTimeOnly } from "../utils/date";

import { useChatContext } from "../contexts/ChatContext";
import { styles } from "./_chat.styles";

import { typingManager } from "../services/typing.manager";
import { messageRepository } from "../services/message.repository";

export default function ChatScreen() {
  const router = useRouter();
  const { channelId, channelName, channelImage } = useLocalSearchParams();
  const [resolvedName, setResolvedName] = useState((channelName as string) || "");
  const [resolvedImage, setResolvedImage] = useState((channelImage as string) || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const flatListRef = useRef<FlashListRef<Message>>(null);
  const messagesRef = useRef<Message[]>([]);
  const isLoadedRef = useRef(false);
  const { lastUpdatedMessage, lastPinnedEvent, resetUnreadCount, readReceipts, broadcastDeleteEvent } = useChatContext();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!channelId) return;
    const unsubscribe = typingManager.subscribe(channelId as string, (usersSet) => {
      setTypingUsers(Array.from(usersSet));
    });
    return () => unsubscribe();
  }, [channelId]);

  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [reactionMenuPosition, setReactionMenuPosition] = useState<{ y: number; height: number } | null>(null);
  const [infoMessageId, setInfoMessageId] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [floatingDate, setFloatingDate] = useState<string | null>(null);
  const [showFloatingDate, setShowFloatingDate] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleItems(new Set(viewableItems.map((v: any) => v.item.message_id)));
    if (viewableItems.length > 0) {
      // Since inverted=true, the top-most visible item has the highest index
      const topItem = viewableItems.reduce((prev: any, current: any) => (prev.index > current.index) ? prev : current);
      if (topItem && topItem.item) {
        setFloatingDate(formatDateHeader(topItem.item.created_at));
      }
    }
  });

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isScrolledUpRef = useRef(false);
  const hasInitiallyScrolled = useRef(false);

  const handleScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // In an inverted list, offset 0 is the bottom.
    // As you scroll up into history, contentOffset.y increases.
    const isCloseToBottom = contentOffset.y < 50;
    
    if (isCloseToBottom) {
      if (isScrolledUpRef.current) {
        setIsScrolledUp(false);
        isScrolledUpRef.current = false;
        setUnreadCount(0);
      }
    } else {
      if (!isScrolledUpRef.current) {
        setIsScrolledUp(true);
        isScrolledUpRef.current = true;
      }
    }

    // Show the floating date pill and hide it after a delay when scrolling stops
    setShowFloatingDate(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setShowFloatingDate(false);
    }, 1500);
  };

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setIsScrolledUp(false);
    isScrolledUpRef.current = false;
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (channelId) {
      resetUnreadCount(channelId as string);
      NotificationService.clearAllNotifications();
    }
  }, [channelId]);

  // Handle incoming message creations and updates in real-time
  useEffect(() => {
    if (lastUpdatedMessage && lastUpdatedMessage.channel_id === channelId) {
      setMessages(prev => {
        const exists = prev.some(m => m.message_id === lastUpdatedMessage.message_id);
        
        let updated;
        if (exists) {
          // Update existing
          updated = prev.map(m => {
            if (m.message_id === lastUpdatedMessage.message_id) {
              if (lastUpdatedMessage.is_deleted) {
                return { ...m, is_deleted: true, text: "This message was deleted", attachments: [] };
              }
              return lastUpdatedMessage;
            }
            return m;
          });
        } else {
          // Append new message
          updated = [...prev, lastUpdatedMessage];
          
          if (!isScrolledUpRef.current || lastUpdatedMessage.sender_email === currentUserEmail) {
            setTimeout(() => {
              scrollToBottom();
            }, 100);
          } else {
            setUnreadCount(c => c + 1);
          }
          ConnectsService.markChannelRead(channelId as string, lastUpdatedMessage.message_id);
          resetUnreadCount(channelId as string);
        }
        
        messageRepository.saveMessagesBatchLocal(updated, channelId as string);
        return updated;
      });
    }
  }, [lastUpdatedMessage, channelId, currentUserEmail, scrollToBottom]);

  useEffect(() => {
    if (lastPinnedEvent && lastPinnedEvent.channelId === channelId) {
      setMessages(prev => {
        const updated = prev.map(m => {
          // If pinning, unpin all others
          if (lastPinnedEvent.isPinned) {
            if (m.message_id === lastPinnedEvent.messageId) return { ...m, is_pinned: true };
            if (m.is_pinned) return { ...m, is_pinned: false };
            return m;
          } else {
            // If unpinning, just unpin the target
            if (m.message_id === lastPinnedEvent.messageId) return { ...m, is_pinned: false };
            return m;
          }
        });
        messageRepository.saveMessagesBatchLocal(updated, channelId as string);
        return updated;
      });
    }
  }, [lastPinnedEvent, channelId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    loadData();

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        if (!isScrolledUpRef.current) {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      }
    );

    return () => {
      showSub.remove();
    };
  }, [channelId]);

  const syncNewMessages = async () => {
    if (!channelId) return;
    const id = channelId as string;
    
    try {
      const liveMessages = await ConnectsService.getMessages(id);
      if (liveMessages && liveMessages.length > 0) {
        setMessages(prev => {
          const messageMap = new Map<string, Message>();
          prev.forEach(m => messageMap.set(m.message_id, m));
          liveMessages.forEach(m => messageMap.set(m.message_id, m));
          
          const updatedMessages = Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          messageRepository.saveMessagesBatchLocal(updatedMessages, id);
          
          if (updatedMessages.length > prev.length) {
            if (!isScrolledUpRef.current) {
              setTimeout(() => {
                scrollToBottom();
              }, 100);
            } else {
              setUnreadCount(c => c + (updatedMessages.length - prev.length));
            }
          }
          return updatedMessages;
        });
        ConnectsService.markChannelRead(id, liveMessages[liveMessages.length - 1].message_id);
      }
    } catch (error) {
      console.log("Error in background sync:", error);
    }
  };

  const loadData = async () => {
    try {
      let currentEmail = "";
      const user = await SessionService.getUser();
      if (user) {
        currentEmail = user.email_id;
        setCurrentUserEmail(user.email_id);
      }

      if (channelId) {
        const id = channelId as string;
        
        // Resolve missing channel info if opened from Push Notification
        if (!channelName) {
          const cachedChannels = await CacheService.getCachedChannels();
          const channel = cachedChannels?.find(c => c.channel_id === id);
          if (channel) {
             const otherMember = channel.channel_type === "direct" 
               ? channel.members?.find((m: any) => m.email?.toLowerCase() !== currentEmail?.toLowerCase())
               : null;
             
             setResolvedName((channel.channel_type === "direct" 
               ? otherMember?.name ?? channel.channel_name 
               : channel.channel_name) || "Unknown");
               
             setResolvedImage((channel.channel_type === "direct"
               ? otherMember?.profile_image_url
               : channel.channel_image) || "");
          }
        }

        // 1. Instant Load from Cache
        const cachedMessages = await messageRepository.getMessages(id);
        if (cachedMessages && cachedMessages.length > 0) {
          setMessages(cachedMessages);
          setLoading(false);
        } else {
          setLoading(true);
        }

        // 2. Background Sync with Live API
        let after: string | undefined;
        // If we only have 1 message in cache, it might be corrupted from the race condition, so fetch all
        if (cachedMessages && cachedMessages.length > 1) {
          // Since cachedMessages is sorted oldest first, newest is at the end
          after = cachedMessages[cachedMessages.length - 1].created_at;
        }

        const liveMessages = await ConnectsService.getMessages(id, after);
        
        // 3. Update UI & Cache (Merge to prevent duplicates)
        if (liveMessages.length > 0) {
          const messageMap = new Map<string, Message>();
          if (cachedMessages) {
             cachedMessages.forEach(m => messageMap.set(m.message_id, m));
          }
          liveMessages.forEach(m => messageMap.set(m.message_id, m));
          
          const updatedMessages = Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );

          setMessages(updatedMessages);
          await messageRepository.saveMessagesBatchLocal(updatedMessages, id);
          
          if (updatedMessages.length > 0) {
            ConnectsService.markChannelRead(id, updatedMessages[updatedMessages.length - 1].message_id);
          }
        } else if (cachedMessages && cachedMessages.length > 0) {
          ConnectsService.markChannelRead(id, cachedMessages[cachedMessages.length - 1].message_id);
        }
      }
    } catch (error) {
      console.log("Error loading messages:", error);
    } finally {
      isLoadedRef.current = true;
      setLoading(false);
    }
  };

  const handleSend = async (text: string, attachments?: any[]) => {
    try {
      const replyId = replyingTo ? replyingTo.message_id : undefined;
      setReplyingTo(null); // clear instantly for better UX
      const response = await ConnectsService.sendMessage(channelId as string, text, attachments, replyId);
      
      if (response && response.created_message) {
        setMessages((prev) => {
          if (prev.some(m => m.message_id === response?.created_message?.message_id)) {
            return prev;
          }
          const updated = [...prev, response.created_message];
          messageRepository.saveMessagesBatchLocal(updated, channelId as string);
          return updated;
        });
        setTimeout(() => {
          if (!isScrolledUpRef.current) {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }
        }, 100);
      }
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (channelId) {
      typingManager.broadcastTyping(channelId as string, isTyping, currentUserEmail, resolvedName);
    }
  };

  const handleReactionToggle = async (messageId: string, emoji: string) => {
    try {
      setMessages(prev => prev.map(m => {
        if (m.message_id === messageId) {
          const newReactions = [...(m.reactions || [])];
          const existingIdx = newReactions.findIndex(r => r.emoji === emoji);
          if (existingIdx >= 0) {
            if (newReactions[existingIdx].user_reacted) {
              newReactions[existingIdx].count -= 1;
              newReactions[existingIdx].user_reacted = false;
              if (newReactions[existingIdx].count <= 0) {
                newReactions.splice(existingIdx, 1);
              }
            } else {
              newReactions[existingIdx].count += 1;
              newReactions[existingIdx].user_reacted = true;
            }
          } else {
            newReactions.push({ emoji, count: 1, user_reacted: true });
          }
          return { ...m, reactions: newReactions };
        }
        return m;
      }));
      await ConnectsService.toggleReaction(messageId, emoji);
    } catch (error) {
      console.log("Error toggling reaction", error);
    }
  };

  const handleCopyMessage = () => {
    if (selectedMessageIds.length > 0) {
      const messagesToCopy = selectedMessageIds.map(id => {
        const msg = messages.find(m => m.message_id === id);
        return msg ? msg.text : "";
      }).join("\n");
      
      Clipboard.setStringAsync(messagesToCopy);
      ToastAndroid.show("Message copied to clipboard", ToastAndroid.SHORT);
      setSelectedMessageIds([]); // Clear selection after copy
    }
  };

  const handleDeleteMessages = async (deleteForEveryone: boolean) => {
    setDeleteModalVisible(false);
    const idsToDelete = [...selectedMessageIds];
    setSelectedMessageIds([]);

    // Optimistic update
    setMessages(prev => {
      const updated = prev.map(m => 
        idsToDelete.includes(m.message_id) 
          ? { ...m, is_deleted: true, text: "This message was deleted", attachments: [] } 
          : m
      );
      messageRepository.saveMessagesBatchLocal(updated, channelId as string);
      return updated;
    });

    // Call API (silent fallback on failure, or could handle rollback)
    for (const msgId of idsToDelete) {
      const success = await ConnectsService.deleteMessage(channelId as string, msgId, deleteForEveryone);
      if (success && deleteForEveryone) {
        broadcastDeleteEvent(channelId as string, msgId);
      }
    }
  };

  const handleReactionSelect = (emoji: string) => {
    if (!selectedMessageIds[0]) return;
    const msgId = selectedMessageIds[0];
    setReactionModalVisible(false);
    handleReactionToggle(msgId, emoji);
    setSelectedMessageIds([]); // Clear selection after reacting
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const olderMessages = await ConnectsService.getMessages(channelId as string, undefined, oldestMessage.created_at, 30);
      if (olderMessages.length > 0) {
        setMessages(prev => {
          const messageMap = new Map<string, Message>();
          olderMessages.forEach(m => messageMap.set(m.message_id, m));
          prev.forEach(m => messageMap.set(m.message_id, m));
          const updated = Array.from(messageMap.values()).sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          messageRepository.saveMessagesBatchLocal(updated, channelId as string);
          return updated;
        });
      }
      if (olderMessages.length < 30) setHasMore(false);
    } catch (error) {
      console.log('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToMessage = (targetMessageId: string) => {
    if (!flatListRef.current) return;
    const allReversed = [...messages].reverse();
    const index = allReversed.findIndex(m => m.message_id === targetMessageId);
    if (index !== -1) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      // Highlight the message after a short delay to let scroll settle
      setTimeout(() => {
        setHighlightedMessageId(targetMessageId);
        // Clear the highlight after animation completes (200ms in + 800ms hold + 400ms out)
        setTimeout(() => setHighlightedMessageId(null), 1500);
      }, 400);
    } else {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Message is not in history.', ToastAndroid.SHORT);
      }
    }
  };

  const displayData = useMemo(() => {
    const start = performance.now();
    const filtered = [...messages]
      .filter(m => {
        const hasText = m.text && m.text.trim().length > 0;
        const hasAttachments = m.attachments && m.attachments.length > 0;
        return hasText || hasAttachments || m.is_deleted;
      })
      .reverse();

    const mapped = filtered.map((item, index) => {
      const timeStr = formatTimeOnly(item.created_at);
      const currentDateStr = formatDateHeader(item.created_at);
      const olderDateStr = filtered[index + 1] ? formatDateHeader(filtered[index + 1].created_at) : null;
      const showDateHeader = currentDateStr !== olderDateStr;
      const isFirstInGroup = filtered[index + 1]?.sender_email !== item.sender_email;
      const showTail = showDateHeader || isFirstInGroup;
      
      const hasText = !!item.text;
      const isEmojiOnly = hasText && /^[\s\p{Emoji}\uFE0F\u200D]+$/u.test(item.text);
      const emojiCount = hasText && isEmojiOnly ? Array.from(item.text.replace(/[\s\uFE0F\u200D]/g, '')).length : 0;
      
      const isSingleEmoji = isEmojiOnly && emojiCount === 1;
      const isMediumEmoji = isEmojiOnly && emojiCount > 1 && emojiCount <= 3;
      const isSmallEmoji = isEmojiOnly && emojiCount > 3;

      return {
        ...item,
        timeStr,
        currentDateStr,
        showDateHeader,
        isFirstInGroup,
        showTail,
        isSingleEmoji,
        isMediumEmoji,
        isSmallEmoji
      };
    });
    
    console.log(`[RENDER_PERF] displayData completely precomputed in ${(performance.now() - start).toFixed(1)}ms`);
    return mapped;
  }, [messages]);

  const allSelectedAreMine = messages
    .filter(m => selectedMessageIds.includes(m.message_id))
    .every(m => m.sender_email === currentUserEmail);

  return (
    <SafeAreaView style={styles.container}>
        {selectedMessageIds.length > 0 ? (
          <SelectionHeader 
            selectedCount={selectedMessageIds.length}
            isPinned={selectedMessageIds.length === 1 ? messages.find(m => m.message_id === selectedMessageIds[0])?.is_pinned : false}
            onPinToggle={selectedMessageIds.length === 1 ? async () => {
              const msgId = selectedMessageIds[0];
              const msg = messages.find(m => m.message_id === msgId);
              if (msg) {
                const newPinnedState = !msg.is_pinned;
                const success = await ConnectsService.togglePinMessage(channelId as string, msgId, newPinnedState);
                if (success) {
                  // Optimistically update local state
                  setMessages(prev => {
                    const updated = prev.map(m => {
                      if (newPinnedState) {
                        if (m.message_id === msgId) return { ...m, is_pinned: true };
                        if (m.is_pinned) return { ...m, is_pinned: false };
                        return m;
                      } else {
                        if (m.message_id === msgId) return { ...m, is_pinned: false };
                        return m;
                      }
                    });
                    messageRepository.saveMessagesBatchLocal(updated, channelId as string);
                    return updated;
                  });
                }
                setSelectedMessageIds([]);
              }
            } : undefined}
            onClearSelection={() => {
              setSelectedMessageIds([]);
              setReactionModalVisible(false);
            }}
            onReply={selectedMessageIds.length === 1 ? () => { 
              const msg = messages.find(m => m.message_id === selectedMessageIds[0]);
              if (msg) setReplyingTo(msg);
              setSelectedMessageIds([]);
              setReactionModalVisible(false);
            } : undefined}
            onStar={() => { /* Handle star */ }}
            onInfo={selectedMessageIds.length === 1 ? () => { 
              setInfoMessageId(selectedMessageIds[0]); 
              setSelectedMessageIds([]); // clear selection when opening info
            } : undefined}
            onDelete={() => setDeleteModalVisible(true)}
            onForward={() => {
              const msgIds = selectedMessageIds.join(',');
              setSelectedMessageIds([]); // Clear selection
              router.push({
                pathname: '/forward',
                params: {
                  sourceChannelId: channelId,
                  messageIds: msgIds
                }
              });
            }}
            onCopy={handleCopyMessage}
            onShare={async () => {
              const selectedMessagesText = messages
                .filter(m => selectedMessageIds.includes(m.message_id))
                .map(m => m.text)
                .filter(t => !!t)
                .join('\n\n');
              
              if (selectedMessagesText) {
                try {
                  await Share.share({
                    message: selectedMessagesText,
                  });
                } catch (error: any) {
                  Alert.alert('Error', error.message);
                }
                setSelectedMessageIds([]);
                setReactionModalVisible(false);
              }
            }}
          />
        ) : (
          <View>
            <ChatHeader 
              name={resolvedName} 
              status="Active" 
              imageUrl={resolvedImage}
              typingUsers={typingUsers}
            />
            {messages.find(m => m.is_pinned) && (
              <TouchableOpacity 
                style={styles.pinnedBanner} 
                activeOpacity={0.8}
                onPress={() => {
                  const pinnedMsg = messages.find(m => m.is_pinned);
                  if (pinnedMsg) {
                    scrollToMessage(pinnedMsg.message_id);
                  }
                }}
              >
                <Ionicons name="pin" size={16} color="#8696A0" style={styles.pinnedIcon} />
                <View style={styles.pinnedTextContainer}>
                  {(() => {
                    const pinnedMsg = messages.find(m => m.is_pinned);
                    const isPhoto = pinnedMsg?.attachments?.[0]?.type?.startsWith('image/');
                    return (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {isPhoto && <Ionicons name="image-outline" size={16} color="#4A6572" style={{ marginRight: 6 }} />}
                        <Text style={styles.pinnedSubtitle} numberOfLines={1}>
                          {pinnedMsg?.text ? pinnedMsg.text : (isPhoto ? "Photo" : "Attachment")}
                        </Text>
                      </View>
                    );
                  })()}
                </View>
                {(() => {
                    const pinnedMsg = messages.find(m => m.is_pinned);
                    const isPhoto = pinnedMsg?.attachments?.[0]?.type?.startsWith('image/');
                    const url = pinnedMsg?.attachments?.[0]?.url || pinnedMsg?.attachments?.[0]?.file_url;
                    if (isPhoto && url) {
                      return <Image source={{ uri: url }} style={styles.pinnedThumbnail} />
                    }
                    return null;
                })()}
              </TouchableOpacity>
            )}
          </View>
        )}

        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 + insets.top : 0}
        >
          <ImageBackground 
            source={require('../assets/images/chat_bg.png')} 
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            {showFloatingDate && floatingDate && (
              <View style={styles.floatingDateContainer}>
                <View style={styles.floatingDatePill}>
                  <Text style={styles.floatingDateText}>{floatingDate}</Text>
                </View>
              </View>
            )}

            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F97316" />
              </View>
            ) : (
              <FlashList<any>
                ref={flatListRef}
                inverted={true}
                data={displayData}
                extraData={{ receipts: readReceipts[channelId as string], visibleItems }}
                keyExtractor={(item, index) => item.message_id + index}
                onViewableItemsChanged={onViewableItemsChanged.current}
                viewabilityConfig={viewabilityConfig.current}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                estimatedItemSize={80}
                bounces={false}
                overScrollMode="never"
                ListFooterComponent={
                  hasMore && loadingMore ? (
                    <View style={{
                      alignItems: 'center',
                      paddingTop: messages.find(m => m.is_pinned) ? 56 : 14,
                      paddingBottom: 14,
                    }}>
                      <View style={{
                        backgroundColor: '#FFFFFF',
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.18,
                        shadowRadius: 2.5,
                      }}>
                        <ActivityIndicator size="small" color="#F97316" />
                      </View>
                    </View>
                  ) : null
                }

                renderItem={({ item, index }) => {
                  const isMine = item.sender_email === currentUserEmail;
                  const lastReadMessageId = readReceipts[channelId as string];
                  const isRead = lastReadMessageId
                    ? messages.findIndex(m => m.message_id === lastReadMessageId) >= index
                    : false;
                  const bubble = (
                    <View>
                      {item.showDateHeader && (
                        <View style={styles.dateHeaderContainer}>
                          <View style={styles.dateHeaderPill}>
                            <Text style={styles.dateHeaderText}>{item.currentDateStr}</Text>
                          </View>
                        </View>
                      )}
                      <MessageBubble
                        messageId={item.message_id}
                        text={item.text}
                        attachments={item.attachments || []}
                          time={item.timeStr}
                          isMine={isMine}
                          showTail={item.showTail}
                          readStatus={isMine ? (item.status === 'sending' || item.status === 'pending' || item.status === 'failed' ? item.status : (isRead ? "read" : "delivered")) : undefined}
                          isVisible={visibleItems.has(item.message_id)}
                          reactions={item.reactions}
                          replyTo={item.reply_to}
                          isForwarded={item.is_forwarded}
                          isDeleted={item.is_deleted}
                          highlighted={highlightedMessageId === item.message_id}
                          isSingleEmoji={item.isSingleEmoji}
                          isMediumEmoji={item.isMediumEmoji}
                          isSmallEmoji={item.isSmallEmoji}
                          onSwipeReply={() => setReplyingTo(item)}
                          onReplyPress={(replyMessageId) => { scrollToMessage(replyMessageId); }}
                          selected={selectedMessageIds.includes(item.message_id)}
                        onLongPress={(y, height) => {
                          setSelectedMessageIds(prev => {
                            if (prev.includes(item.message_id)) return prev;
                            const next = [...prev, item.message_id];
                            if (next.length === 1) {
                              setReactionMenuPosition({ y, height });
                              setReactionModalVisible(true);
                            } else {
                              setReactionModalVisible(false);
                            }
                            return next;
                          });
                        }}
                        onReactionPress={(emoji) => handleReactionToggle(item.message_id, emoji)}
                      />
                    </View>
                  );
                  return bubble;
                }}
                contentContainerStyle={[
                  styles.listContent, 
                  { paddingBottom: 16, flexGrow: 1, justifyContent: 'flex-end' }
                ]}
              />
            )}

            {isScrolledUp && (
              <TouchableOpacity style={styles.floatingPill} onPress={scrollToBottom}>
                <Ionicons name="chevron-down" size={20} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </ImageBackground>
  
          <View style={{ backgroundColor: '#F5F7FA' }}>
            <MessageInput 
              onSend={handleSend} 
              onTyping={handleTyping} 
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          </View>
        </KeyboardAvoidingView>

        <ReactionPicker 
          visible={reactionModalVisible}
          onClose={() => setReactionModalVisible(false)}
          onSelectReaction={handleReactionSelect}
          position={reactionMenuPosition}
        />

        <Modal visible={!!infoMessageId} animationType="slide" onRequestClose={() => setInfoMessageId(null)}>
          {infoMessageId && (
            <MessageInfo 
              message={messages.find(m => m.message_id === infoMessageId)!}
              currentUserEmail={currentUserEmail}
              onClose={() => setInfoMessageId(null)}
            />
          )}
        </Modal>

        <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <Text style={styles.deleteModalTitle}>Delete message?</Text>
            
            {allSelectedAreMine && (
              <TouchableOpacity 
                style={styles.deleteModalButton}
                onPress={() => handleDeleteMessages(true)}
              >
                <Text style={styles.deleteModalButtonText}>Delete for everyone</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.deleteModalButton}
              onPress={() => handleDeleteMessages(false)}
            >
              <Text style={styles.deleteModalButtonText}>Delete for me</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteModalButton}
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.deleteModalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
  );
}


