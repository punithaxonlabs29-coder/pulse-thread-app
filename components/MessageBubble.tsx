import React, { useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ImageAttachment from "./ImageAttachment";
import VideoAttachment from "./VideoAttachment";
import { Reaction } from "../types/connects";

interface MessageBubbleProps {
  messageId: string;
  text: string;
  time: string;
  isMine: boolean;
  attachments?: any[];
  readStatus?: "sent" | "delivered" | "read";
  isVisible?: boolean;
  reactions?: Reaction[];
  onLongPress?: () => void;
  onReactionPress?: (emoji: string) => void;
}

export default function MessageBubble({ messageId, text, time, isMine, attachments, readStatus, isVisible = false, reactions, onLongPress, onReactionPress }: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const TEXT_LIMIT = 300;

  const shouldTruncate = text && text.length > TEXT_LIMIT;
  const displayedText = shouldTruncate && !isExpanded ? text.substring(0, TEXT_LIMIT) + "..." : text;

  const renderText = (textContent: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = textContent.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <Text 
            key={i} 
            style={{ color: isMine ? '#E2E8F0' : '#3B82F6', textDecorationLine: 'underline' }} 
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onLongPress}
      style={[
        styles.messageContainer,
        isMine ? styles.myMessage : styles.otherMessage,
      ]}
    >
      {text ? (
        <View>
          <Text
            style={[
              styles.messageText,
              isMine ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {renderText(displayedText)}
          </Text>
          {shouldTruncate && (
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
              <Text 
                style={[
                  styles.readMoreText,
                  isMine ? styles.myReadMoreText : styles.otherReadMoreText
                ]}
              >
                {isExpanded ? "Read Less" : "Read More"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {attachments?.map((file, index) => {
        const type = file.type || file.mime_type || "";
        const url = file.url || file.file_url;
        const name = file.name || "Attachment";

        // IMAGE
        if (type.startsWith("image/")) {
          return (
            <ImageAttachment
              key={index}
              url={url || ""}
              name={name}
              messageId={messageId}
            />
          );
        }

        // VIDEO
        if (type.startsWith("video/") || name.endsWith(".webm") || name.endsWith(".mp4")) {
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} isMine={isMine} type="video" isVisible={isVisible} />;
        }

        // AUDIO
        if (type.startsWith("audio/")) {
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} isMine={isMine} type="audio" isVisible={isVisible} />;
        }

        // LINK
        if (type.toLowerCase() === "link" || file.file_type === "Link") {
          return null; // Don't render link attachments, they are now handled as inline hyperlinks
        }

        // DOCUMENT
        return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} isMine={isMine} type="document" />;
      })}

      <View style={styles.timeRow}>
        <Text style={[styles.time, isMine ? styles.myTimeText : styles.otherTimeText]}>
          {time}
        </Text>
        {isMine && readStatus && (
          <Ionicons
            name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
            size={16}
            color={readStatus === "read" ? "#3b82f6" : "#FFEDD5"}
            style={styles.tickIcon}
          />
        )}
      </View>

      {reactions && reactions.length > 0 && (
        <View style={styles.reactionsContainer}>
          {reactions.map((reaction, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.reactionPill, reaction.user_reacted && styles.reactionPillActive]}
              onPress={() => onReactionPress && onReactionPress(reaction.emoji)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              <Text style={styles.reactionCount}>{reaction.count}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: "75%",
    marginVertical: 6,
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#fcb27d",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#111827",
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 6,
  },
  myReadMoreText: {
    color: "#FFEDD5",
  },
  otherReadMoreText: {
    color: "#fcb27d",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    marginTop: 6,
  },
  time: {
    fontSize: 11,
  },
  tickIcon: {
    marginLeft: 4,
  },
  myTimeText: {
    color: "#FFEDD5",
  },
  otherTimeText: {
    color: "#6B7280",
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  fileName: {
    marginLeft: 8,
    color: "#fcb27d",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  myFileName: {
    color: "#FFFFFF",
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reactionPillActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  reactionEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  reactionCount: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  }
});
