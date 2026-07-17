import React, { useMemo } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Channel } from "../types/connects";
import { formatMessageTime } from "../utils/date";
import { createStyles } from './ThreadCard.styles';
import { useTyping } from "../hooks/useTyping";
import { AppText } from "./ui/AppText";
import { useColors } from "../design";

interface ThreadCardProps {
  channel: Channel;
  currentUserEmail: string;
  displayMessage?: string;
  displayAttachments?: any[];
  displayTime?: string;
  displayUnreadCount?: number;
  isSelected?: boolean;
  onLongPress?: () => void;
  onPress: () => void;
}

export default React.memo(function ThreadCard({
  channel,
  currentUserEmail,
  displayMessage,
  displayAttachments = [],
  displayTime,
  displayUnreadCount,
  isSelected,
  onLongPress,
  onPress,
}: ThreadCardProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const typingUsersSet = useTyping(channel.channel_id);
  const typingUsers = Array.from(typingUsersSet);

  const otherMember =
    channel.channel_type === "direct"
      ? channel.members.find(
          member => member.email?.toLowerCase() !== currentUserEmail?.toLowerCase()
        )
      : null;

  const title =
    (channel.channel_type === "direct"
      ? otherMember?.name ?? channel.channel_name
      : channel.channel_name) || "Unknown";

  const image =
    channel.channel_type === "direct"
      ? otherMember?.profile_image_url
      : channel.channel_image || "";

  const initials = (title || "U")
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const getAttachmentInfo = () => {
    if (!displayAttachments || displayAttachments.length === 0) return null;
    const type = displayAttachments[0].type || displayAttachments[0].mime_type || "";
    if (type.startsWith("image/")) return { icon: "image", label: "Photo" };
    if (type.startsWith("video/")) return { icon: "videocam", label: "Video" };
    if (type.startsWith("audio/")) return { icon: "mic", label: "Audio" };
    if (type.toLowerCase() === "link") return { icon: "link", label: "Link" };
    return { icon: "document-text", label: "Document" };
  };

  const attachmentInfo = getAttachmentInfo();
  const showText = displayMessage || (attachmentInfo ? attachmentInfo.label : "No messages yet");

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.avatarContainer}>
        {image ? (
        <Image
          source={{ uri: image }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          {channel.channel_type === "channel" ? (
            <Ionicons
              name="people"
              size={28}
              color={colors.text.inverse}
            />
          ) : (
            <AppText variant="h2" color={colors.text.inverse}>
              {initials}
            </AppText>
          )}
        </View>
      )}
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
        </View>
      )}
      </View>

      <View style={styles.center}>
        <AppText
          variant="title"
          numberOfLines={1}
        >
          {title}
        </AppText>

        {typingUsers.length > 0 ? (
          <AppText variant="bodySemibold" color={colors.status.success} numberOfLines={1} style={styles.typingSubtitle}>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </AppText>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {attachmentInfo && (
              <Ionicons name={attachmentInfo.icon as any} size={14} color={colors.text.secondary} style={{ marginRight: 4, marginTop: 2 }} />
            )}
            <AppText
              variant="body"
              color={colors.text.secondary}
              numberOfLines={1}
              style={[styles.subtitle, { flex: 1 }]}
            >
              {showText}
            </AppText>
          </View>
        )}
      </View>

      <View style={styles.right}>
        <AppText variant="caption" color={colors.text.secondary} style={styles.time}>
          {formatMessageTime(displayTime ?? channel.last_message?.created_at)}
        </AppText>

        {(displayUnreadCount !== undefined ? displayUnreadCount : channel.unread_count) > 0 && (
          <View style={styles.badge}>
            <AppText variant="badge" color={colors.text.inverse}>
              {displayUnreadCount !== undefined ? displayUnreadCount : channel.unread_count}
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});
