import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ThreadCard from "../components/ThreadCard";
import { useChatContext } from "../contexts/ChatContext";
import { CacheService } from "../services/cache.service";
import { ConnectsService } from "../services/connects.service";
import { SessionService } from "../services/session.service";
import { syncEventBus } from "../services/sync.engine";
import { Channel, Message } from "../types/connects";
import { createStyles } from '../styles/index.styles';
import { useColors } from "../design";
import { AppText } from "../components/ui/AppText";

export default function ArchivedScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const { connectChannels, registerMembers, unreadCounts } = useChatContext();
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [archivedChannelIds, setArchivedChannelIds] = useState<string[]>([]);

  const router = useRouter();
  const lastFetchTime = React.useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
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
          return true;
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

      const cachedChannels = await CacheService.getCachedChannels();
      if (cachedChannels && cachedChannels.length > 0) {
        setChannels(cachedChannels);
        registerMembers(cachedChannels);
        connectChannels(cachedChannels.map(c => c.channel_id));
        setLoading(false);
      } else {
        setLoading(true);
      }

      const liveChannels = await ConnectsService.getChannels();

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

  const handleUnarchiveSelected = async () => {
    const nextArchived = archivedChannelIds.filter(id => !selectedChannels.includes(id));
    setArchivedChannelIds(nextArchived);
    await CacheService.saveArchivedChannelIds(nextArchived);
    setSelectedChannels([]);
  };

  const archivedChannelsList = useMemo(() => {
    const filtered = channels.filter(c => archivedChannelIds.includes(c.channel_id));
    return filtered.sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : new Date(a.updated_at).getTime();
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : new Date(b.updated_at).getTime();
      return timeB - timeA;
    });
  }, [channels, archivedChannelIds]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
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
          <AppText style={styles.actionBarCount}>{selectedChannels.length}</AppText>
          <View style={styles.actionIcons}>
            <TouchableOpacity style={styles.actionIconButton} onPress={handleUnarchiveSelected}>
              <Ionicons name="archive-outline" size={22} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8, marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <AppText style={styles.title}>Archived</AppText>
          <View style={{ flex: 1 }} />
        </View>
      )}

      <FlatList
        data={archivedChannelsList}
        keyExtractor={(item) => item.channel_id}
        renderItem={({ item }) => {
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
    </SafeAreaView>
  );
}
