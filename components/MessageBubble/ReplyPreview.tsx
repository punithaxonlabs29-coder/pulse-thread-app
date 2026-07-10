import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { styles } from './ReplyPreview.styles';


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
  if (!replyTo) return null;

  const isPhoto = replyTo.attachments?.[0]?.type?.startsWith('image/');
  const url = replyTo.attachments?.[0]?.url || replyTo.attachments?.[0]?.file_url;

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => onReplyPress && onReplyPress(replyTo.message_id)}
    >
      <View style={styles.replySnippetContainer}>
        <View style={[styles.replySnippetLeftBar, { backgroundColor: '#FF8C00' }]} />
        <View style={[styles.replySnippetContent, { backgroundColor: '#FFF3E0' }]}>
          <Text style={[styles.replySnippetName, { color: '#FF8C00' }]} numberOfLines={1}>
            {replyTo.sender_name || "Unknown"}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isPhoto && (
              <Ionicons name="image" size={12} color="#4A6572" style={{ marginRight: 4 }} />
            )}
            <Text style={styles.replySnippetText} numberOfLines={1}>
              {replyTo.text || (isPhoto ? 'Photo' : 'Attachment')}
            </Text>
          </View>
        </View>
        {isPhoto && url && (
          <View style={[styles.replySnippetContent, { backgroundColor: '#FFF3E0', flex: 0 }]}>
            <Image source={{ uri: url }} style={styles.replySnippetThumbnail} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prev, next) => {
  return JSON.stringify(prev.replyTo) === JSON.stringify(next.replyTo);
});

