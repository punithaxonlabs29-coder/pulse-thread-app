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
import { messageRepository } from "../services/message.repository";
import { Channel, Message } from "../types/connects";
import { createStyles } from './_forward.styles';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';


export default function ForwardScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { sourceChannelId, messageIds } = useLocalSearchParams();

  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [optionalMessage, setOptionalMessage] = useState("");
  const [messagesToForward, setMessagesToForward] = useState<Message[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load channels
      const user = await SessionService.getUser();
      if (user) {
        setCurrentUserEmail(user.email_id);
        const fetchedChannels = await ConnectsService.getChannels();
        setChannels(fetchedChannels);
      }

      // Load original messages to forward
      if (sourceChannelId && messageIds) {
        const ids = (messageIds as string).split(',');
        const cachedMessages = await messageRepository.getMessages(sourceChannelId as string, 500, 0);
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
        (m: any) => m.email_id !== currentUserEmail
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
            <AppText style={styles.avatarText}>{getInitials(channelName)}</AppText>
          )}
        </View>

        <View style={styles.channelInfo}>
          <AppText style={styles.channelName} numberOfLines={1}>
            {channelName}
          </AppText>
          <AppText style={styles.channelSubtext} numberOfLines={1}>
            {item.channel_type === 'direct' ? 'Available' : `${item.members.length} members`}
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Forward to...</AppText>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.channel_id}
          renderItem={renderItem}
          ListHeaderComponent={
            <AppText style={styles.sectionHeader}>Recent chats</AppText>
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
                  ? messagesToForward[0].text || 'Attachment' 
                  : `${messagesToForward.length} messages selected`}
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

