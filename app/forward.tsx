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
import { Channel, Message } from "../types/connects";

export default function ForwardScreen() {
  const router = useRouter();
  const { sourceChannelId, messageIds } = useLocalSearchParams();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [optionalMessage, setOptionalMessage] = useState("");
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load channels
      const user = await SessionService.getUser();
      if (user) {
        const fetchedChannels = await ConnectsService.getChannels(user.org_gst_number);
        setChannels(fetchedChannels);
      }

      // Load original messages to forward
      if (sourceChannelId && messageIds) {
        const ids = (messageIds as string).split(',');
        const cachedMessages = await CacheService.getCachedMessages(sourceChannelId as string) || [];
        const toForward = cachedMessages.filter(m => ids.includes(m.message_id));
        setMessagesToForward(toForward);
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
        // 1. Send all forwarded messages
        for (const msg of messagesToForward) {
          // Re-use attachments by creating pseudo-file objects containing the urls
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
            undefined, // no replyTo for forwarded messages
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
        ToastAndroid.show('Messages forwarded successfully', ToastAndroid.SHORT);
      }
      router.back();
    } catch (error) {
      console.log("Error forwarding messages:", error);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to forward messages', ToastAndroid.SHORT);
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
        (m: any) => m.email_id !== SessionService.currentUser?.email_id
      );
      return otherMember?.name || channel.channel_name;
    }
    return channel.channel_name;
  };

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
            <Text style={styles.avatarText}>{getInitials(channelName)}</Text>
          )}
        </View>

        <View style={styles.channelInfo}>
          <Text style={styles.channelName} numberOfLines={1}>
            {channelName}
          </Text>
          <Text style={styles.channelSubtext} numberOfLines={1}>
            {item.channel_type === 'direct' ? 'Available' : `${item.members.length} members`}
          </Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Forward to...</Text>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8C00" />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.channel_id}
          renderItem={renderItem}
          ListHeaderComponent={
            <Text style={styles.sectionHeader}>Recent chats</Text>
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
              <Text style={styles.previewText} numberOfLines={1}>
                {messagesToForward.length === 1 
                  ? messagesToForward[0].text || 'Attachment' 
                  : `${messagesToForward.length} messages selected`}
              </Text>
            </View>
            
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Add a message..."
                  placeholderTextColor="#8F98A0"
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
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 100, // padding for bottom bar
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  channelSubtext: {
    color: "#64748B",
    fontSize: 14,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionCircleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF8C00",
  },
  bottomBar: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  previewContainer: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewText: {
    color: "#64748B",
    fontSize: 14,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textInput: {
    color: "#111827",
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
  },
});
