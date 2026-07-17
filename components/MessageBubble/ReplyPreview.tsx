import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from './ReplyPreview.styles';
import { AppText } from '../ui/AppText';
import { useColors } from '../../design';


interface ReplyPreviewProps {
  replyTo?: {
    message_id: string;
    sender_name: string;
    text: string;
    attachments?: any[];
  };
  onReplyPress?: (messageId: string) => void;
}

export const ReplyPreview = React.memo(({ replyTo, onReplyPress }: ReplyPreviewProps) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!replyTo) return null;

  const isPhoto = replyTo.attachments?.[0]?.type?.startsWith('image/');
  const url = replyTo.attachments?.[0]?.url || replyTo.attachments?.[0]?.file_url;

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => onReplyPress && onReplyPress(replyTo.message_id)}
    >
      <View style={styles.replySnippetContainer}>
        <View style={styles.replySnippetLeftBar} />
        <View style={styles.replySnippetContent}>
          <AppText variant="bodySemibold" style={styles.replySnippetName} numberOfLines={1}>
            {replyTo.sender_name || "Unknown"}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isPhoto && (
              <Ionicons name="image" size={12} color={colors.text.muted} style={{ marginRight: 4 }} />
            )}
            <AppText variant="caption" style={styles.replySnippetText} numberOfLines={1}>
              {replyTo.text || (isPhoto ? 'Photo' : 'Attachment')}
            </AppText>
          </View>
        </View>
        {isPhoto && url && (
          <View style={[styles.replySnippetContent, { flex: 0 }]}>
            <Image source={{ uri: url }} style={styles.replySnippetThumbnail} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return JSON.stringify(prev.replyTo) === JSON.stringify(next.replyTo);
});
