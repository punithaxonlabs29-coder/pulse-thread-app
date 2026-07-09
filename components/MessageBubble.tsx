import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Reaction } from "../types/connects";
import ImageAttachment from "./ImageAttachment";
import VideoAttachment from "./VideoAttachment";

interface MessageBubbleProps {
  messageId: string;
  text: string;
  time: string;
  isMine: boolean;
  attachments?: any[];
  readStatus?: "sent" | "delivered" | "read";
  isVisible?: boolean;
  reactions?: Reaction[];
  selected?: boolean;
  showTail?: boolean;
  onLongPress?: (y: number, height: number) => void;
  onReactionPress?: (emoji: string) => void;
}

export default function MessageBubble({ 
  messageId, text, time, isMine, attachments, readStatus, 
  isVisible = false, reactions, selected = false, showTail = true,
  onLongPress, onReactionPress 
}: MessageBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bubbleRef = React.useRef<View>(null);
  const TEXT_LIMIT = 300;

  const shouldTruncate = text && text.length > TEXT_LIMIT;
  const displayedText = shouldTruncate && !isExpanded ? text.substring(0, TEXT_LIMIT) + "..." : text;

  const hasAttachments = attachments && attachments.length > 0;
  const hasText = !!text;
  const showOverlayTime = !hasText; // Only show time inside media if there is no caption text

  // Check if text is emojis only
  const isEmojiOnly = hasText && /^[\s\p{Emoji}\uFE0F\u200D]+$/u.test(text);
  const emojiCount = hasText && isEmojiOnly ? Array.from(text.replace(/[\s\uFE0F\u200D]/g, '')).length : 0;
  
  const isSingleEmoji = isEmojiOnly && emojiCount === 1;
  const isMediumEmoji = isEmojiOnly && emojiCount > 1 && emojiCount <= 3;
  const isSmallEmoji = isEmojiOnly && emojiCount > 3;

  const renderText = (textContent: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = textContent.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <Text 
            key={i} 
            style={{ color: isMine ? '#111827' : '#3B82F6', textDecorationLine: 'underline' }} 
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  const handleLongPress = () => {
    if (onLongPress && bubbleRef.current) {
      bubbleRef.current.measureInWindow((x, y, width, height) => {
        onLongPress(y, height);
      });
    }
  };

  return (
    <View style={[
      styles.bubbleWrapper, 
      selected && styles.selectedWrapper
    ]}>
      <TouchableOpacity
        ref={bubbleRef}
        activeOpacity={0.9}
        onLongPress={handleLongPress}
        style={[
          styles.messageContainer,
          isMine ? styles.myMessage : styles.otherMessage,
          !showTail && (isMine ? styles.myMessageNoTail : styles.otherMessageNoTail),
          hasAttachments && !hasText && { paddingHorizontal: 4, paddingVertical: 4 },
          isSingleEmoji && styles.transparentMessage
        ]}
      >
        {showTail && !isSingleEmoji && (isMine ? <View style={styles.myTail} /> : <View style={styles.otherTail} />)}

        {attachments?.map((file, index) => {
          const type = file.type || file.mime_type || "";
          const url = file.url || file.file_url;
          const name = file.name || "Attachment";

          // Pass time props down to attachments if they need to render the overlay
          const mediaProps = {
             time: showOverlayTime ? time : undefined,
             readStatus: showOverlayTime ? readStatus : undefined,
             isMine
          };

          if (type.startsWith("image/")) {
            return <ImageAttachment key={index} url={url || ""} name={name} messageId={messageId} {...mediaProps} />;
          }
          if (type.startsWith("video/") || name.endsWith(".webm") || name.endsWith(".mp4")) {
            return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} type="video" isVisible={isVisible} {...mediaProps} />;
          }
          if (type.startsWith("audio/")) {
            return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} type="audio" isVisible={isVisible} {...mediaProps} />;
          }
          if (type.toLowerCase() === "link" || file.file_type === "Link") {
            return null;
          }
          return <VideoAttachment key={index} url={url || ""} messageId={messageId} name={name} type="document" {...mediaProps} />;
        })}

        {hasText ? (
          <View style={[hasAttachments ? { marginTop: 4 } : {}, { position: 'relative' }]}>
            <Text
              style={[
                styles.messageText,
                isMine ? styles.myMessageText : styles.otherMessageText,
                isSingleEmoji && styles.singleEmojiText,
                isMediumEmoji && styles.mediumEmojiText,
                isSmallEmoji && styles.smallEmojiText
              ]}
            >
              {renderText(displayedText)}
              {/* This inline View acts as a physical block pushing the text to wrap 
                  if it gets too close to the absolute positioned time footer! */}
              <View style={{ width: isMine && readStatus ? 75 : 60, height: 10 }} />
            </Text>
            
            {shouldTruncate && (
              <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={[styles.readMoreText, isMine ? styles.myReadMoreText : styles.otherReadMoreText]}>
                  {isExpanded ? "Read Less" : "Read More"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Time flows perfectly to the bottom right of the text block because of the View spacer above */}
            <View style={[
              styles.absoluteFooter,
              isSingleEmoji && (isMine ? styles.singleEmojiTimePillMy : styles.singleEmojiTimePillOther)
            ]}>
              <Text style={[
                styles.time, 
                isMine ? styles.myTimeText : styles.otherTimeText,
                isSingleEmoji && { color: '#6B7280' }
              ]}>
                {time}
              </Text>
              {isMine && readStatus && (
                <Ionicons
                  name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
                  size={14}
                  color={readStatus === "read" ? "#53BDEB" : "#8696A0"}
                  style={styles.tickIcon}
                />
              )}
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Reactions - placed outside the bubble in normal flow below it */}
      {reactions && reactions.length > 0 && (
        <View style={[styles.reactionsContainer, isMine ? styles.myReactionsContainer : styles.otherReactionsContainer]}>
          {reactions.map((reaction, index) => (
            <TouchableOpacity 
              key={index} 
              style={[styles.reactionPill, reaction.user_reacted && styles.reactionPillActive]}
              onPress={() => onReactionPress && onReactionPress(reaction.emoji)}
            >
              <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              {reaction.count > 1 && <Text style={styles.reactionCount}>{reaction.count}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleWrapper: {
    width: "100%",
    paddingVertical: 1, 
    marginBottom: 8, 
  },
  selectedWrapper: {
    backgroundColor: "rgba(0,0,0,0.08)", 
  },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    position: "relative",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#F8A871", 
    borderTopRightRadius: 0,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 0,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  transparentMessage: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  myMessageNoTail: {
    borderTopRightRadius: 8,
  },
  otherMessageNoTail: {
    borderTopLeftRadius: 8,
  },
  myTail: {
    position: "absolute",
    right: -10,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 16,
    borderTopColor: "#F8A871",
    borderRightWidth: 10,
    borderRightColor: "transparent",
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  otherTail: {
    position: "absolute",
    left: -10,
    top: 0,
    width: 0,
    height: 0,
    borderTopWidth: 16,
    borderTopColor: "#FFFFFF",
    borderLeftWidth: 10,
    borderLeftColor: "transparent",
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  singleEmojiText: {
    fontSize: 80,
    lineHeight: 96,
  },
  mediumEmojiText: {
    fontSize: 44,
    lineHeight: 52,
  },
  smallEmojiText: {
    fontSize: 32,
    lineHeight: 40,
  },
  myMessageText: {
    color: "#111827",
  },
  otherMessageText: {
    color: "#111827",
  },
  absoluteFooter: {
    position: "absolute",
    bottom: -2,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  singleEmojiTimePillMy: {
    backgroundColor: '#F8A871',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    bottom: 4,
    right: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  singleEmojiTimePillOther: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    bottom: 4,
    right: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  time: {
    fontSize: 11,
  },
  myTimeText: {
    color: "rgba(17,24,39,0.6)", 
  },
  otherTimeText: {
    color: "#8696A0",
  },
  tickIcon: {
    marginLeft: 2,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  myReadMoreText: {
    color: "#3B82F6",
  },
  otherReadMoreText: {
    color: "#3B82F6",
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -2,
    zIndex: 10,
  },
  myReactionsContainer: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  otherReactionsContainer: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 0, // Tightest valid padding to mimic the requested -1
    height: 24, // Fixed height to keep it tight
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  reactionPillActive: {
    backgroundColor: '#F3F4F6', 
  },
  reactionEmoji: {
    fontSize: 16, // Increased from 14
  },
  reactionCount: {
    fontSize: 11,
    marginLeft: 4,
    color: '#6B7280',
    fontWeight: '500',
  }
});
