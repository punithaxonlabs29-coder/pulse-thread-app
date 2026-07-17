import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from './AttachmentPreview.styles';
import { useColors } from '../design';


export interface PendingAttachment {
  uri: string;
  type: string; // e.g. 'image/jpeg', 'video/mp4', 'application/pdf'
  name: string;
  size?: number;
  mimeType?: string;
}

interface Props {
  attachments: PendingAttachment[];
  onRemove: (index: number) => void;
}

export default function AttachmentPreview({ attachments, onRemove }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  if (!attachments || attachments.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {attachments.map((att, index) => {
          const isImage = att.type.startsWith('image/');
          const isVideo = att.type.startsWith('video/');

          return (
            <View key={index} style={styles.attachmentWrapper}>
              {isImage ? (
                <Image source={{ uri: att.uri }} style={styles.preview} />
              ) : isVideo ? (
                <View style={[styles.preview, styles.iconContainer, { backgroundColor: colors.text.secondary }]}>
                  <Ionicons name="videocam" size={24} color={colors.text.inverse} />
                </View>
              ) : (
                <View style={[styles.preview, styles.iconContainer, { backgroundColor: colors.brand.primary }]}>
                  <Ionicons name="document-text" size={24} color={colors.text.inverse} />
                </View>
              )}
              
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}>
                <Ionicons name="close" size={14} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
