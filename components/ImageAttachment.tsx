import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import { ConnectsService } from '../services/connects.service';

interface ImageAttachmentProps {
  url: string;
  name: string;
  messageId: string;
  time?: string;
  readStatus?: "sent" | "delivered" | "read";
  isMine?: boolean;
}

export default function ImageAttachment({ url, name, messageId, time, readStatus, isMine }: ImageAttachmentProps) {
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
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: source }} 
        style={styles.image} 
        contentFit="cover" 
        cachePolicy="memory-disk" 
        transition={200}
      />
      {time && (
        <View style={styles.timeOverlay}>
          <Text style={styles.timeText}>{time}</Text>
          {isMine && readStatus && (
            <Ionicons
              name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
              size={14}
              color={readStatus === "read" ? "#53BDEB" : "#FFFFFF"}
              style={styles.tickIcon}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  loadingContainer: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 11,
  },
  tickIcon: {
    marginLeft: 2,
  }
});
