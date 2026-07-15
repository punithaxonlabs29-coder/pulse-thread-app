import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { styles } from './MessageText.styles';


interface MessageTextProps {
  text: string;
  isMine: boolean;
  isSingleEmoji: boolean;
  isMediumEmoji: boolean;
  isSmallEmoji: boolean;
  hasAttachments: boolean;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  searchText?: string;
  searchEnabled?: boolean;
}

export const MessageText = React.memo(({
  text,
  isMine,
  isSingleEmoji,
  isMediumEmoji,
  isSmallEmoji,
  hasAttachments,
  readStatus,
  searchText = '',
  searchEnabled = false,
}: MessageTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const TEXT_LIMIT = 300;

  if (!text) return null;

  const shouldTruncate = text.length > TEXT_LIMIT;
  const displayedText = shouldTruncate && !isExpanded ? text.substring(0, TEXT_LIMIT) + "..." : text;

  /**
   * Splits a string into segments, marking which parts match the search query.
   * Works independently of URL detection so both can coexist.
   */
  const splitBySearch = (str: string): { part: string; isMatch: boolean }[] => {
    if (!searchEnabled || !searchText.trim()) {
      return [{ part: str, isMatch: false }];
    }
    const query = searchText.trim();
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const raw = str.split(regex);
    return raw.map(s => ({ part: s, isMatch: regex.test(s) && s.toLowerCase() === query.toLowerCase() }));
  };

  const renderText = (textContent: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlParts = textContent.split(urlRegex);

    return urlParts.map((part, i) => {
      const isUrl = !!part.match(urlRegex);

      if (isUrl) {
        return (
          <Text
            key={`url-${i}`}
            style={{ color: isMine ? '#111827' : '#3B82F6', textDecorationLine: 'underline' }}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }

      // Non-URL segment — apply search highlighting inside it
      const segments = splitBySearch(part);
      return (
        <Text key={`seg-${i}`}>
          {segments.map((seg, j) =>
            seg.isMatch ? (
              <Text
                key={j}
                style={{
                  backgroundColor: '#FDE68A',
                  color: '#111827',
                  borderRadius: 2,
                }}
              >
                {seg.part}
              </Text>
            ) : (
              <Text key={j}>{seg.part}</Text>
            )
          )}
        </Text>
      );
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
          isSmallEmoji && styles.smallEmojiText,
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
         prev.readStatus === next.readStatus &&
         prev.searchText === next.searchText &&
         prev.searchEnabled === next.searchEnabled;
});
