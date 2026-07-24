import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConnectsService } from "../services/connects.service";
import { SessionService } from "../services/session.service";
import { CacheService } from "../services/cache.service";
import { messageRepository } from "../services/message.repository";
import { Channel, Message } from "../types/connects";
import { createStyles } from '../styles/forward.styles';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';


export default function ForwardScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { sourceChannelId, messageIds, sharedFiles, sharedText } = useLocalSearchParams();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [optionalMessage, setOptionalMessage] = useState("");
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Load User Session
      const user = await SessionService.getUser();
      if (user) {
        setCurrentUserEmail(user.email_id || "");
      }

      // 2. Instant Load from Cache
      const cached = await CacheService.getCachedChannels();
      if (cached && cached.length > 0) {
        setChannels(cached);
        setLoading(false);
      }

      // 3. Fetch Live Channels from API
      try {
        let fetchedChannels = await ConnectsService.getChannels();
        if (fetchedChannels && fetchedChannels.length > 0) {
          setChannels(fetchedChannels);
          CacheService.saveChannels(fetchedChannels);
        } else {
          // Fallback: If channels are empty, fetch people/contacts
          const people = await ConnectsService.getPeople();
          if (Array.isArray(people) && people.length > 0) {
            const peopleChannels: Channel[] = people.map((p: any) => ({
              channel_id: p.email_id || p.id || p.email,
              channel_name: p.name || p.full_name || p.customer_name || 'Contact',
              channel_type: 'direct',
              members: [
                { email_id: p.email_id || p.email, name: p.name || p.full_name || p.customer_name },
                { email_id: user?.email_id || '', name: 'You' }
              ],
              channel_image: p.profile_pic || p.avatar
            }));
            setChannels(peopleChannels);
          }
        }
      } catch (apiErr) {
        console.log("Error fetching live channels for forward/share:", apiErr);
      }

      // 4. Process Incoming Messages / Shared Intent Files
      if (sourceChannelId && messageIds) {
        const ids = (messageIds as string).split(',');
        const cachedMessages = await messageRepository.getMessages(sourceChannelId as string, 500, 0);
        const toForward = cachedMessages.filter(m => ids.includes(m.message_id));
        setMessagesToForward(toForward);
      } else if (sharedFiles) {
        try {
          const files = JSON.parse(sharedFiles as string);
          const mappedMessages: Message[] = files.map((f: any, idx: number) => ({
            message_id: `shared_${Date.now()}_${idx}`,
            channel_id: "",
            sender_email: user?.email_id || "",
            sender_name: "You",
            text: (sharedText as string) || "",
            created_at: new Date().toISOString(),
            status: "pending",
            attachments: [
              {
                file_url: f.path || f.uri,
                url: f.path || f.uri,
                name: f.fileName || f.name || `shared_file_${Date.now()}`,
                type: f.mimeType || f.type || "application/octet-stream",
                size: f.size || 0,
              },
            ],
          }));
          setMessagesToForward(mappedMessages);
        } catch (e) {
          console.log("Error parsing shared files:", e);
        }
      } else if (sharedText) {
        setOptionalMessage(sharedText as string);
        setMessagesToForward([
          {
            message_id: `shared_text_${Date.now()}`,
            channel_id: "",
            sender_email: user?.email_id || "",
            sender_name: "You",
            text: sharedText as string,
            created_at: new Date().toISOString(),
            status: "pending",
            attachments: [],
          },
        ]);
      }
    } catch (error) {
      console.log("Error loading forward data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (channelId: string) => {
    setSelectedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedChannels.size === 0 || messagesToForward.length === 0) return;
    
    setSending(true);
    try {
      for (const channelId of Array.from(selectedChannels)) {
        // 1. Send all forwarded / shared messages
        for (const msg of messagesToForward) {
          const attachments = msg.attachments?.map(a => ({
            uri: a.file_url || a.url,
            name: a.name || 'attachment',
            type: a.type || 'application/octet-stream',
            size: a.size || 0
          })) || [];

          await ConnectsService.sendMessage(
            channelId, 
            msg.text, 
            attachments, 
            undefined, // no replyTo
            true       // isForwarded = true
          );
        }

        // 2. Send optional typed message if present
        if (optionalMessage.trim()) {
          await ConnectsService.sendMessage(
            channelId,
            optionalMessage.trim()
          );
        }
      }

      if (Platform.OS === 'android') {
        ToastAndroid.show('Sent successfully', ToastAndroid.SHORT);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.log("Error forwarding / sharing messages:", error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to send shared item', ToastAndroid.SHORT);
      }
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  const getChannelName = (channel: Channel) => {
    if (channel.channel_type === "direct") {
      const otherMember = channel.members.find(
        (m: any) => m.email_id !== currentUserEmail
      );
      return otherMember?.name || channel.channel_name;
    }
    return channel.channel_name;
  };

  const filteredChannels = channels.filter((item) => {
    const name = getChannelName(item).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }: { item: Channel }) => {
    const isSelected = selectedChannels.has(item.channel_id);
    const channelName = getChannelName(item);

    return (
      <TouchableOpacity 
        style={styles.channelItem} 
        onPress={() => toggleSelection(item.channel_id)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          {item.channel_image ? (
            <Image source={{ uri: item.channel_image }} style={styles.avatarImage} />
          ) : (
            <AppText style={styles.avatarText}>{getInitials(channelName)}</AppText>
          )}
        </View>

        <View style={styles.channelInfo}>
          <AppText style={styles.channelName} numberOfLines={1}>
            {channelName}
          </AppText>
          <AppText style={styles.channelSubtext} numberOfLines={1}>
            {item.channel_type === 'direct' ? 'Available' : `${item.members?.length || 0} members`}
          </AppText>
        </View>

        <View style={styles.selectionCircle}>
          {isSelected ? (
            <View style={styles.selectionCircleInner} />
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Send to...</AppText>
      </View>

      {/* Search Input Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border.primary, borderRadius: 20, paddingHorizontal: 12, height: 40 }}>
          <Ionicons name="search" size={18} color={colors.text.secondary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 15, color: colors.text.primary }}
            placeholder="Search contacts..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Loading State */}
      {loading && channels.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredChannels}
          keyExtractor={(item) => item.channel_id}
          renderItem={renderItem}
          ListHeaderComponent={
            <AppText style={styles.sectionHeader}>Recent chats & contacts</AppText>
          }
          ListEmptyComponent={
            <View style={{ padding: 24, alignItems: 'center' }}>
              <AppText style={{ color: colors.text.muted }}>No contacts found</AppText>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Bottom Bar */}
      {selectedChannels.size > 0 && (
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.bottomBar}>
            {/* Selected Count / Preview */}
            <View style={styles.previewContainer}>
              <AppText style={styles.previewText} numberOfLines={1}>
                {messagesToForward.length === 1 
                  ? messagesToForward[0].text || '1 item selected' 
                  : `${messagesToForward.length} items selected`}
              </AppText>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add a message..."
                  placeholderTextColor={colors.text.muted}
                  value={optionalMessage}
                  onChangeText={setOptionalMessage}
                  multiline
                />
              </View>
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator size="small" color={colors.text.inverse} />
                ) : (
                  <Ionicons name="send" size={20} color={colors.text.inverse} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

