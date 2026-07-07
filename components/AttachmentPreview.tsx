import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
                <View style={[styles.preview, styles.iconContainer, { backgroundColor: '#4B5563' }]}>
                  <Ionicons name="videocam" size={24} color="#FFFFFF" />
                </View>
              ) : (
                <View style={[styles.preview, styles.iconContainer, { backgroundColor: '#2563EB' }]}>
                  <Ionicons name="document-text" size={24} color="#FFFFFF" />
                </View>
              )}
              
              <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  attachmentWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
