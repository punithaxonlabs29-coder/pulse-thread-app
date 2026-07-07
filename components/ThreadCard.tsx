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
  onPress: () => void;
}

export default function ThreadCard({
  channel,
  currentUserEmail,
  onPress,
}: ThreadCardProps) {

  const otherMember =
    channel.channel_type === "direct"
      ? channel.members.find(
          member => member.email !== currentUserEmail
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

        <Text
          numberOfLines={1}
          style={styles.subtitle}
        >
          {channel.last_message?.text ??
            "No messages yet"}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.time}>
          {formatMessageTime(channel.last_message?.created_at)}
        </Text>

        {channel.unread_count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {channel.unread_count}
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
    backgroundColor: "#2563EB",
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
