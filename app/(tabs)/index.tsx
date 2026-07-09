import React, { useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import ThreadCard from "../../components/ThreadCard";
import { ConnectsService } from "../../services/connects.service";
import { SessionService } from "../../services/session.service";
import { CacheService } from "../../services/cache.service";
import { Channel } from "../../types/connects";
import { useChatContext } from "../../contexts/ChatContext";

export default function ChatsScreen() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const { connectChannels, lastMessages, typingState, registerMembers, unreadCounts } = useChatContext();

  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const user = await SessionService.getUser();
      if (user) {
        setCurrentUserEmail(user.email_id);
      }

      // 1. Instant Load from Cache
      const cachedChannels = await CacheService.getCachedChannels();
      if (cachedChannels && cachedChannels.length > 0) {
        setChannels(cachedChannels);
        registerMembers(cachedChannels);
        connectChannels(cachedChannels.map(c => c.channel_id));
        setLoading(false);
      } else {
        setLoading(true);
      }

      // 2. Background Sync with Live API
      const liveChannels = await ConnectsService.getChannels();
      
      // 3. Update UI & Cache
      setChannels(liveChannels);
      registerMembers(liveChannels);
      connectChannels(liveChannels.map(c => c.channel_id));
      await CacheService.saveChannels(liveChannels);

    } catch (error) {
      console.log('Error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (channel: Channel) => {
    console.log("Navigating to Chat:", channel.channel_id);

    const otherMember = channel.channel_type === "direct" 
      ? channel.members.find(m => m.email?.toLowerCase() !== currentUserEmail?.toLowerCase())
      : null;
    const derivedName = channel.channel_type === "direct" ? (otherMember?.name || channel.channel_name) : channel.channel_name;
    const derivedImage = channel.channel_type === "direct" ? (otherMember?.profile_image_url || "") : "";

    router.push({
      pathname: "/chat",
      params: { 
        channelId: channel.channel_id,
        channelName: derivedName,
        channelImage: derivedImage
      }
    });
  };

  const sortedChannels = useMemo(() => {
    return [...channels].sort((a, b) => {
      const msgA = lastMessages[a.channel_id];
      const timeA = msgA ? new Date(msgA.created_at).getTime() : 
                    (a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime());
      
      const msgB = lastMessages[b.channel_id];
      const timeB = msgB ? new Date(msgB.created_at).getTime() : 
                    (b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime());
      
      return timeB - timeA;
    });
  }, [channels, lastMessages]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#F97316"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Pulse Threads
        </Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={() => router.push("/new-chat")}
        >
          <Ionicons name="create-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sortedChannels}
        keyExtractor={(item) => item.channel_id}
        renderItem={({ item }) => {
          // Apply real-time last message if available from context
          const realTimeMessage = lastMessages[item.channel_id];
          const displayMessage = realTimeMessage?.text || item.last_message?.text;
          const displayAttachments = realTimeMessage?.attachments || item.last_message?.attachments || [];
          const displayTime = realTimeMessage?.created_at || item.updated_at;
          const activeTypingUsers = typingState[item.channel_id] ? Array.from(typingState[item.channel_id]) : [];
          const displayUnreadCount = unreadCounts[item.channel_id] ?? item.unread_count;

          const otherMember = item.channel_type === "direct" 
            ? item.members?.find(m => m.email?.toLowerCase() !== currentUserEmail?.toLowerCase())
            : null;
            
          const resolvedChannelName = (item.channel_type === "direct" 
            ? otherMember?.name ?? item.channel_name 
            : item.channel_name) || "Unknown";
            
          const resolvedChannelImage = item.channel_type === "direct"
            ? otherMember?.profile_image_url || ""
            : item.channel_image;

          return (
            <ThreadCard
              channel={item}
              currentUserEmail={currentUserEmail}
              displayMessage={displayMessage}
              displayAttachments={displayAttachments}
              displayTime={displayTime}
              displayUnreadCount={displayUnreadCount}
              typingUsers={activeTypingUsers}
              onPress={() => {
                router.push({
                  pathname: "/chat",
                  params: {
                    channelId: item.channel_id,
                    channelName: resolvedChannelName,
                    channelImage: resolvedChannelImage,
                  },
                });
              }}
            />
          );
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  listContainer: {
    paddingBottom: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  newChatButton: {
    padding: 8,
  },
});
