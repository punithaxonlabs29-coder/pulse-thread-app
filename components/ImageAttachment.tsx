import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ConnectsService } from '../services/connects.service';

interface ImageAttachmentProps {
  url: string;
  name: string;
  messageId: string;
}

export default function ImageAttachment({ url, name, messageId }: ImageAttachmentProps) {
  const [source, setSource] = useState<string | null>(url || null);

  useEffect(() => {
    if (!url) {
      ConnectsService.getMessageAttachment(messageId).then((attachments) => {
        if (attachments && attachments.length > 0) {
           const att = attachments.find((a: any) => a.name === name) || attachments[0];
           setSource(att?.url || att?.file_url || "");
        }
      }).catch(err => console.log("Failed to load image base64", err));
    }
  }, [url, messageId, name]);

  if (!source) {
    return (
      <View style={[styles.image, styles.loadingContainer]}>
        <ActivityIndicator color="#2563EB" />
      </View>
    );
  }

  return <Image source={{ uri: source }} style={styles.image} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  image: {
    width: 220,
    height: 220,
    borderRadius: 12,
    marginTop: 8,
  },
  loadingContainer: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
