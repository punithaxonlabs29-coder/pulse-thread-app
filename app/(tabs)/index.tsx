import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThreadCard from "../../components/ThreadCard";
import { useChatContext } from "../../contexts/ChatContext";
import { CacheService } from "../../services/cache.service";
import { ConnectsService } from "../../services/connects.service";
import { SessionService } from "../../services/session.service";
import { syncEventBus } from "../../services/sync.engine";
import { Channel, Message } from "../../types/connects";
import { styles } from './index.styles';


export default function ChatsScreen() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Groups'>('All');
  const { connectChannels, registerMembers, unreadCounts } = useChatContext();
  const [menuVisible, setMenuVisible] = useState(false);

  const router = useRouter();
  const lastFetchTime = React.useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      // Only refetch if it's been more than 10 seconds since the last fetch
      if (now - lastFetchTime.current > 10000) {
        lastFetchTime.current = now;
        loadData();
      }
    }, [])
  );

  useEffect(() => {
    const handleNewMessage = (event: string, data: { channelId: string, message: Message }) => {
      setChannels(prev => {
        const idx = prev.findIndex(c => c.channel_id === data.channelId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          last_message: data.message,
          updated_at: data.message.created_at
        };
        return next;
      });
    };

    syncEventBus.on('new_message', handleNewMessage);
    return () => {
      syncEventBus.off('new_message', handleNewMessage);
    };
  }, []);

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
        channelImage: derivedImage,
        channelType: channel.channel_type
      }
    });
  };

  const sortedChannels = useMemo(() => {
    let filtered = [...channels];

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const otherMember = c.channel_type === "direct"
          ? c.members?.find(m => m.email?.toLowerCase() !== currentUserEmail?.toLowerCase())
          : null;
        const name = (c.channel_type === "direct" ? (otherMember?.name ?? c.channel_name) : c.channel_name) || "Unknown";
        return name.toLowerCase().includes(q);
      });
    }

    // Apply chip filter
    if (activeFilter === 'Unread') {
      filtered = filtered.filter(c => (unreadCounts[c.channel_id] ?? c.unread_count) > 0);
    } else if (activeFilter === 'Groups') {
      filtered = filtered.filter(c => c.channel_type === 'channel');
    }

    return filtered.sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime();
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime();
      return timeB - timeA;
    });
  }, [channels, searchQuery, activeFilter, unreadCounts, currentUserEmail]);

  const totalUnreadCount = useMemo(() => {
    return channels.filter(c => (unreadCounts[c.channel_id] ?? c.unread_count) > 0).length;
  }, [channels, unreadCounts]);

  const totalGroupsCount = useMemo(() => {
    return channels.filter(c => c.channel_type === 'channel').length;
  }, [channels]);

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
        <Text style={styles.title}>Pulse Threads</Text>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          hitSlop={10}
        >
          <Ionicons
            name="ellipsis-vertical"
            size={22}
            color="#374151"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {menuVisible && (
  <>
    <TouchableOpacity
      style={styles.menuOverlay}
      activeOpacity={1}
      onPress={() => setMenuVisible(false)}
    />

    <View style={styles.popupMenu}>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setMenuVisible(false);
          router.push("/new-group");
        }}
      >

        <Text style={styles.menuText}>
          New Group
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setMenuVisible(false);
          router.push("/profile");
        }}
      >

        <Text style={styles.menuText}>
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  </>
)}

      <FlatList
        ListHeaderComponent={
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.filtersScrollContainer}
          >
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'All' && styles.filterChipActive]}
              onPress={() => setActiveFilter('All')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'All' && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Unread' && styles.filterChipActive]}
              onPress={() => setActiveFilter('Unread')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'Unread' && styles.filterChipTextActive]}>
                Unread {totalUnreadCount > 0 ? totalUnreadCount : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === 'Groups' && styles.filterChipActive]}
              onPress={() => setActiveFilter('Groups')}
            >
              <Text style={[styles.filterChipText, activeFilter === 'Groups' && styles.filterChipTextActive]}>
                Groups {totalGroupsCount > 0 ? totalGroupsCount : ''}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        }
        data={sortedChannels}
        keyExtractor={(item) => item.channel_id}
        renderItem={({ item }) => {
          // Channels state is now real-time updated via syncEventBus
          const displayMessage = item.last_message?.text;
          const displayAttachments = item.last_message?.attachments || [];
          const displayTime = item.last_message?.created_at || item.updated_at;
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
              onPress={() => {
                router.push({
                  pathname: "/chat",
                  params: {
                    channelId: item.channel_id,
                    channelName: resolvedChannelName,
                    channelImage: resolvedChannelImage,
                    channelType: item.channel_type,
                  },
                });
              }}
            />
          );
        }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/new-chat")}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

