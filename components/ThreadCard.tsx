import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Channel } from "../types/connects";
import { formatMessageTime } from "../utils/date";

interface ThreadCardProps {
  channel: Channel;
  currentUserEmail: string;
  displayMessage?: string;
  displayAttachments?: any[];
  displayTime?: string;
  displayUnreadCount?: number;
  typingUsers?: string[];
  onPress: () => void;
}

export default function ThreadCard({
  channel,
  currentUserEmail,
  displayMessage,
  displayAttachments = [],
  displayTime,
  displayUnreadCount,
  typingUsers = [],
  onPress,
}: ThreadCardProps) {

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
      : "";

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
      style={styles.container}
      activeOpacity={0.8}
      onPress={onPress}
    >
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
              color="#FFFFFF"
            />
          ) : (
            <Text style={styles.initials}>
              {initials}
            </Text>
          )}
        </View>
      )}

      <View style={styles.center}>
        <Text
          numberOfLines={1}
          style={styles.title}
        >
          {title}
        </Text>

        {typingUsers.length > 0 ? (
          <Text numberOfLines={1} style={styles.typingSubtitle}>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {attachmentInfo && (
              <Ionicons name={attachmentInfo.icon as any} size={14} color="#6B7280" style={{ marginRight: 4, marginTop: 2 }} />
            )}
            <Text
              numberOfLines={1}
              style={[styles.subtitle, { flex: 1 }]}
            >
              {showText}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>
          {formatMessageTime(displayTime ?? channel.last_message?.created_at)}
        </Text>

        {(displayUnreadCount !== undefined ? displayUnreadCount : channel.unread_count) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {displayUnreadCount !== undefined ? displayUnreadCount : channel.unread_count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },

  initials: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },

  center: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },
  
  typingSubtitle: {
    marginTop: 4,
    color: "#22C55E",
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "500",
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 50,
  },

  time: {
    fontSize: 12,
    color: "#6B7280",
  },

  badge: {
    backgroundColor: "#22C55E",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
