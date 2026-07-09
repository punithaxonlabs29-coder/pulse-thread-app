import React, { useState, useRef, useEffect, useCallback } from "react";
import { FlatList, StyleSheet, Platform, ActivityIndicator, View, ImageBackground, KeyboardAvoidingView, Text, Keyboard, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ChatHeader from "../components/ChatHeader";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import ReactionPicker from "../components/ReactionPicker";
import { ConnectsService } from "../services/connects.service";
import { SessionService } from "../services/session.service";
import { Message } from "../types/connects";
import { formatMessageTime } from "../utils/date";
import { CacheService } from "../services/cache.service";

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
  const { sendTypingStatus, lastMessages, typingState, resetUnreadCount, readReceipts } = useChatContext();
  const typingUsers = typingState[channelId as string] ? Array.from(typingState[channelId as string]) : [];

  const [reactionModalVisible, setReactionModalVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 10 });
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleItems(new Set(viewableItems.map((v: any) => v.item.message_id)));
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
      const response = await ConnectsService.sendMessage(channelId as string, text, attachments);
      
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
    if (!selectedMessageId) return;
    const msgId = selectedMessageId;
    setSelectedMessageId(null);
    setReactionModalVisible(false);
    handleReactionToggle(msgId, emoji);
  };

  const handleLoadMore = () => {
    if (displayLimit < messages.length) {
      setDisplayLimit(prev => prev + 30);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ChatHeader 
        name={resolvedName} 
        status="Active" 
        imageUrl={resolvedImage}
        typingUsers={typingUsers}
      />

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
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F97316" />
              </View>
            ) : (
              <FlatList
            ref={flatListRef}
            inverted={true}
            data={[...messages].reverse().slice(0, displayLimit)}
            extraData={{ receipts: readReceipts[channelId as string], visibleItems }}
            keyExtractor={(item, index) => item.message_id + index}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item, index }) => {
              const isMine = item.sender_email === currentUserEmail;
              const lastReadMessageId = readReceipts[channelId as string];
              
              // Note: since data is reversed, index mapping to the original array needs reversal if used strictly
              // But for readStatus, checking if it's in the read receipt is enough.
              const isRead = lastReadMessageId 
                ? messages.findIndex(m => m.message_id === lastReadMessageId) >= messages.findIndex(m => m.message_id === item.message_id)
                : false;
  
              return (
                <MessageBubble 
                  messageId={item.message_id}
                  text={item.text} 
                  attachments={item.attachments || []}
                  time={formatMessageTime(item.created_at)} 
                  isMine={isMine} 
                  readStatus={isMine ? (isRead ? "read" : "delivered") : undefined}
                  isVisible={visibleItems.has(item.message_id)}
                  reactions={item.reactions}
                  onLongPress={() => {
                    setSelectedMessageId(item.message_id);
                    setReactionModalVisible(true);
                  }}
                  onReactionPress={(emoji) => handleReactionToggle(item.message_id, emoji)}
                />
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
            <MessageInput onSend={handleSend} onTyping={handleTyping} />
          </View>
        </KeyboardAvoidingView>

        <ReactionPicker 
          visible={reactionModalVisible}
          onClose={() => setReactionModalVisible(false)}
          onSelectReaction={handleReactionSelect}
        />
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
    bottom: 16,
    right: 16,
    backgroundColor: '#F97316',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  }
});
