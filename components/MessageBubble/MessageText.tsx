import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { createStyles } from './MessageText.styles';
import { AppText } from '../ui/AppText';
import { useColors } from '../../design';


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
  mentions?: any[];
  onMentionPress?: (userName: string) => void;
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
  mentions = [],
  onMentionPress,
}: MessageTextProps) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    const tokenRegex = /(https?:\/\/[^\s]+|@[A-Za-z0-9_\s]+?(?=\s|[.,!?]|$))/g;
    const parts = textContent.split(tokenRegex);

    return parts.map((part, i) => {
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <Text
            key={`url-${i}`}
            style={[styles.urlText, isMine ? styles.myUrlText : styles.otherUrlText]}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        );
      }

      if (part.startsWith('@')) {
        const userName = part.slice(1).trim();
        return (
          <Text
            key={`mention-${i}`}
            style={{ fontWeight: 'bold', textDecorationLine: 'underline', color: isMine ? '#FFFFFF' : colors.brand.primary }}
            onPress={() => onMentionPress && onMentionPress(userName)}
          >
            {part}
          </Text>
        );
      }

      // Non-URL / Non-Mention segment — apply search highlighting inside it
      const segments = splitBySearch(part);
      return (
        <Text key={`seg-${i}`}>
          {segments.map((seg, j) =>
            seg.isMatch ? (
              <Text
                key={j}
                style={styles.searchHighlight}
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
      <AppText
        variant="body"
        maxFontSizeMultiplier={undefined}
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
      </AppText>

      {shouldTruncate && (
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <AppText style={[styles.readMoreText, isMine ? styles.myReadMoreText : styles.otherReadMoreText]}>
            {isExpanded ? "Read Less" : "Read More"}
          </AppText>
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
