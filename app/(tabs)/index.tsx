import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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
import { createStyles } from './index.styles';
import { AppText } from "../../components/ui/AppText";
import { useColors } from "../../design";

export default function ChatsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unread' | 'Groups'>('All');
  const { connectChannels, registerMembers, unreadCounts } = useChatContext();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [archivedChannelIds, setArchivedChannelIds] = useState<string[]>([]);

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

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (selectedChannels.length > 0) {
          setSelectedChannels([]);
          return true; // prevent default back behavior
        }
        return false;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [selectedChannels])
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

      // Un-archive if needed
      setArchivedChannelIds(prev => {
        if (prev.includes(data.channelId)) {
          const next = prev.filter(id => id !== data.channelId);
          CacheService.saveArchivedChannelIds(next);
          return next;
        }
        return prev;
      });
    };

    const handleChannelUpdated = (event: string, updatedChannel: Channel) => {
      setChannels(prev => {
        const idx = prev.findIndex(c => c.channel_id === updatedChannel.channel_id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          ...updatedChannel
        };
        return next;
      });
    };

    syncEventBus.on('new_message', handleNewMessage);
    syncEventBus.on('channel_updated', handleChannelUpdated);
    return () => {
      syncEventBus.off('new_message', handleNewMessage);
      syncEventBus.off('channel_updated', handleChannelUpdated);
    };
  }, []);

  const loadData = async () => {
    try {
      const user = await SessionService.getUser();
      if (user) {
        setCurrentUserEmail(user.email_id);
      }

      const cachedArchivedIds = await CacheService.getArchivedChannelIds();
      setArchivedChannelIds(cachedArchivedIds);

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

  const handleLongPress = (channelId: string) => {
    setSelectedChannels(prev => {
      if (prev.includes(channelId)) {
        return prev.filter(id => id !== channelId);
      } else {
        return [...prev, channelId];
      }
    });
  };

  const handlePress = (channel: Channel) => {
    if (selectedChannels.length > 0) {
      handleLongPress(channel.channel_id);
      return;
    }

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

  const handleComingSoon = (action: string) => {
    Alert.alert("Coming Soon", `${action} functionality will be available in a future update.`);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      `Delete ${selectedChannels.length} chat${selectedChannels.length > 1 ? 's' : ''}?`,
      "Are you sure you want to delete the selected chats?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const results = await Promise.allSettled(
              selectedChannels.map(id => ConnectsService.deleteChannel(id))
            );
            
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
              Alert.alert("Error", `Failed to delete ${failures.length} chat(s). Please try again.`);
            }

            // Only keep the failed ones selected
            if (failures.length > 0) {
              const failedIndexes = results.map((r, idx) => r.status === 'rejected' ? idx : -1).filter(idx => idx !== -1);
              setSelectedChannels(failedIndexes.map(idx => selectedChannels[idx]));
            } else {
              setSelectedChannels([]);
            }
            
            loadData();
          }
        }
      ]
    );
  };

  const handleArchiveSelected = async () => {
    const nextArchived = Array.from(new Set([...archivedChannelIds, ...selectedChannels]));
    setArchivedChannelIds(nextArchived);
    await CacheService.saveArchivedChannelIds(nextArchived);
    setSelectedChannels([]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SessionService.clearSession();
          console.log("Logged out successfully");
          router.replace("/(auth)/login");
        },
      },
    ]);
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

    return filtered.filter(c => !archivedChannelIds.includes(c.channel_id)).sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime();
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime();
      return timeB - timeA;
    });
  }, [channels, searchQuery, activeFilter, unreadCounts, currentUserEmail, archivedChannelIds]);

  const totalUnreadCount = useMemo(() => {
    return channels.filter(c => !archivedChannelIds.includes(c.channel_id) && (unreadCounts[c.channel_id] ?? c.unread_count) > 0).length;
  }, [channels, unreadCounts, archivedChannelIds]);

  const totalGroupsCount = useMemo(() => {
    return channels.filter(c => !archivedChannelIds.includes(c.channel_id) && c.channel_type === 'channel').length;
  }, [channels, archivedChannelIds]);

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
      {selectedChannels.length > 0 ? (
        <View style={styles.actionBar}>
          <TouchableOpacity onPress={() => setSelectedChannels([])} style={{ padding: 8, marginLeft: -8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <AppText variant="h2" color={colors.text.inverse} style={styles.actionBarCount}>{selectedChannels.length}</AppText>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.actionIconButton} onPress={handleDeleteSelected}>
              <Ionicons name="trash" size={22} color={colors.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconButton} onPress={handleArchiveSelected}>
              <Ionicons name="archive" size={22} color={colors.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIconButton} onPress={() => handleComingSoon("More")}>
              <Ionicons name="ellipsis-vertical" size={22} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <AppText variant="h1">Pulse Threads</AppText>

          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            hitSlop={10}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={colors.text.secondary}
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
        <AppText variant="body" style={styles.menuText}>
          New Group
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setMenuVisible(false);
          router.push("/profile");
        }}
      >
        <AppText variant="body" style={styles.menuText}>
          Settings
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          setMenuVisible(false);
          handleLogout();
        }}
      >
        <AppText variant="body" style={styles.menuText}>
          Logout
        </AppText>
      </TouchableOpacity>
    </View>
  </>
)}

      <FlatList
        ListHeaderComponent={
          <>
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
                <AppText variant="bodySemibold" color={activeFilter === 'All' ? colors.text.inverse : colors.brand.primary}>
                  All
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, activeFilter === 'Unread' && styles.filterChipActive]}
                onPress={() => setActiveFilter('Unread')}
              >
                <AppText variant="bodySemibold" color={activeFilter === 'Unread' ? colors.text.inverse : colors.brand.primary}>
                  Unread {totalUnreadCount > 0 ? totalUnreadCount : ''}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, activeFilter === 'Groups' && styles.filterChipActive]}
                onPress={() => setActiveFilter('Groups')}
              >
                <AppText variant="bodySemibold" color={activeFilter === 'Groups' ? colors.text.inverse : colors.brand.primary}>
                  Groups {totalGroupsCount > 0 ? totalGroupsCount : ''}
                </AppText>
              </TouchableOpacity>
            </ScrollView>
            
            {archivedChannelIds.length > 0 && (
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderBottomColor: colors.border.primary }}
                onPress={() => router.push("/archived")}
              >
                <Ionicons name="archive-outline" size={24} color={colors.text.secondary} />
                <AppText variant="bodySemibold" style={{ marginLeft: 20, flex: 1 }}>Archived</AppText>
                <AppText variant="bodySemibold" color={colors.brand.primary}>{archivedChannelIds.length}</AppText>
              </TouchableOpacity>
            )}
          </>
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
              isSelected={selectedChannels.includes(item.channel_id)}
              onLongPress={() => handleLongPress(item.channel_id)}
              onPress={() => handlePress(item)}
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
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.text.inverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

