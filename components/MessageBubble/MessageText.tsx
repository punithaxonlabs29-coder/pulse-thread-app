import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { styles } from './MessageText.styles';


interface MessageTextProps {
  text: string;
  isMine: boolean;
  isSingleEmoji: boolean;
  isMediumEmoji: boolean;
  isSmallEmoji: boolean;
  hasAttachments: boolean;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
}

export const MessageText = React.memo(({ 
  text, 
  isMine, 
  isSingleEmoji, 
  isMediumEmoji, 
  isSmallEmoji, 
  hasAttachments,
  readStatus
}: MessageTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const TEXT_LIMIT = 300;
  
  if (!text) return null;

  const shouldTruncate = text.length > TEXT_LIMIT;
  const displayedText = shouldTruncate && !isExpanded ? text.substring(0, TEXT_LIMIT) + "..." : text;

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

  return (
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
        <View style={{ width: isMine && readStatus ? 75 : 60, height: 10 }} />
      </Text>
      
      {shouldTruncate && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={[styles.readMoreText, isMine ? styles.myReadMoreText : styles.otherReadMoreText]}>
            {isExpanded ? "Read Less" : "Read More"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}, (prev, next) => {
  return prev.text === next.text &&
         prev.isMine === next.isMine &&
         prev.hasAttachments === next.hasAttachments &&
         prev.readStatus === next.readStatus;
});

