import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, ToastAndroid, TouchableOpacity, View, Modal, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function ChatScreen() {
  const { channelId, channelName, channelImage } = useLocalSearchParams();
  const [resolvedName, setResolvedName] = useState((channelName as string) || "");
  const [resolvedImage, setResolvedImage] = useState((channelImage as string) || "");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const messagesRef = useRef<Message[]>([]);
  const isLoadedRef = useRef(false);
  const { sendTypingStatus, lastMessages, lastUpdatedMessage, lastPinnedEvent, typingState, resetUnreadCount, readReceipts } = useChatContext();
  const typingUsers = typingState[channelId as string] ? Array.from(typingState[channelId as string]) : [];

  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [reactionMenuPosition, setReactionMenuPosition] = useState<{ y: number; height: number } | null>(null);
  const [infoMessageId, setInfoMessageId] = useState<string | null>(null);
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
  const [displayLimit, setDisplayLimit] = useState(30);
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

  useEffect(() => {
    if (channelId && lastMessages[channelId as string] && isLoadedRef.current) {
      const newMessage = lastMessages[channelId as string];
      resetUnreadCount(channelId as string);
      
      setMessages(prev => {
        if (prev.some(m => m.message_id === newMessage.message_id)) {
          return prev;
        }
        const updated = [...prev, newMessage];
        CacheService.saveMessages(channelId as string, updated);
        
        if (!isScrolledUpRef.current || newMessage.sender_email === currentUserEmail) {
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } else {
          setUnreadCount(c => c + 1);
        }
        
        return updated;
      });
      ConnectsService.markChannelRead(channelId as string, newMessage.message_id);
    }
  }, [lastMessages[channelId as string], currentUserEmail, scrollToBottom]);

  // Handle incoming message updates (like reactions) in real-time
  useEffect(() => {
    if (lastUpdatedMessage && lastUpdatedMessage.channel_id === channelId) {
      setMessages(prev => {
        const updated = prev.map(m => m.message_id === lastUpdatedMessage.message_id ? lastUpdatedMessage : m);
        CacheService.saveMessages(channelId as string, updated);
        return updated;
      });
    }
  }, [lastUpdatedMessage, channelId]);

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
        CacheService.saveMessages(channelId as string, updated);
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
          
          CacheService.saveMessages(id, updatedMessages);
          
          if (updatedMessages.length > prev.length) {
            setDisplayLimit(current => current + (updatedMessages.length - prev.length));
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
        const cachedMessages = await CacheService.getCachedMessages(id);
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
          await CacheService.saveMessages(id, updatedMessages);
          
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
          CacheService.saveMessages(channelId as string, updated);
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
    if (sendTypingStatus && channelId) {
      sendTypingStatus(channelId as string, isTyping);
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

  const handleReactionSelect = (emoji: string) => {
    if (!selectedMessageIds[0]) return;
    const msgId = selectedMessageIds[0];
    setReactionModalVisible(false);
    handleReactionToggle(msgId, emoji);
    setSelectedMessageIds([]); // Clear selection after reacting
  };

  const handleLoadMore = () => {
    if (displayLimit < messages.length) {
      setDisplayLimit(prev => prev + 20);
    }
  };

  const displayData = [...messages].reverse().slice(0, displayLimit);

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
                    CacheService.saveMessages(channelId as string, updated);
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
            onDelete={allSelectedAreMine ? () => { /* Handle delete */ } : undefined}
            onForward={() => { /* Handle forward */ }}
            onCopy={async () => {
              const selectedMessagesText = messages
                .filter(m => selectedMessageIds.includes(m.message_id))
                .map(m => m.text)
                .filter(t => !!t)
                .join('\n\n');
              
              if (selectedMessagesText) {
                await Clipboard.setStringAsync(selectedMessagesText);
                setSelectedMessageIds([]);
                setReactionModalVisible(false);
                if (Platform.OS === 'android') {
                  ToastAndroid.show('Message copied', ToastAndroid.SHORT);
                } else {
                  Alert.alert('Copied', 'Message copied to clipboard');
                }
              }
            }}
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
                  if (pinnedMsg && flatListRef.current) {
                    const index = displayData.findIndex(m => m.message_id === pinnedMsg.message_id);
                    if (index !== -1) {
                      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
                    } else {
                      if (Platform.OS === 'android') {
                        ToastAndroid.show('Message is too far back in history to scroll to.', ToastAndroid.SHORT);
                      }
                    }
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
              <FlatList
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
            onEndReachedThreshold={0.5}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
              });
            }}
            renderItem={({ item, index }) => {
              const isMine = item.sender_email === currentUserEmail;
              const lastReadMessageId = readReceipts[channelId as string];
              
              const isRead = lastReadMessageId 
                ? messages.findIndex(m => m.message_id === lastReadMessageId) >= index
                : false;
  
              const currentDateStr = formatDateHeader(item.created_at);
              const olderDateStr = displayData[index + 1] ? formatDateHeader(displayData[index + 1].created_at) : null;
              const showDateHeader = currentDateStr !== olderDateStr;

              const isFirstInGroup = displayData[index + 1]?.sender_email !== item.sender_email;
              const showTail = showDateHeader || isFirstInGroup;

              return (
                <View>
                  {showDateHeader && (
                    <View style={styles.dateHeaderContainer}>
                      <View style={styles.dateHeaderPill}>
                        <Text style={styles.dateHeaderText}>{currentDateStr}</Text>
                      </View>
                    </View>
                  )}
                  <MessageBubble 
                    messageId={item.message_id}
                    text={item.text} 
                    attachments={item.attachments || []}
                    time={formatTimeOnly(item.created_at)} 
                    isMine={isMine} 
                    showTail={showTail}
                    readStatus={isMine ? (isRead ? "read" : "delivered") : undefined}
                    isVisible={visibleItems.has(item.message_id)}
                    reactions={item.reactions}
                    replyTo={item.reply_to}
                    onSwipeReply={() => setReplyingTo(item)}
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
            }}
            contentContainerStyle={[styles.listContent, { paddingBottom: 16 }]}
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
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loader: {
    justifyContent: "center",
    alignItems: "center",
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  typingIndicatorText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: 16,
    paddingTop: 24,
  },
  floatingPill: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#374151',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  floatingDateContainer: {
    position: 'absolute',
    top: 10,
    width: '100%',
    alignItems: 'center',
    zIndex: 20,
  },
  floatingDatePill: {
    backgroundColor: 'rgba(235, 239, 243, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  floatingDateText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#10B981', // Subtle green badge on the orange pill for unread
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F1ED', // Light orange background as requested
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pinnedIcon: {
    marginRight: 12,
  },
  pinnedTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pinnedSubtitle: {
    fontSize: 14,
    color: '#4A6572', // Bluish gray text color
  },
  pinnedThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 4,
    marginLeft: 12,
  },
  dateHeaderContainer: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateHeaderPill: {
    backgroundColor: "#ECE5DD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#54656F",
  }
});
