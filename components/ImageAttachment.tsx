import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import { ConnectsService } from '../services/connects.service';
import DownloadButton from './ui/DownloadButton';
import { createStyles } from './ImageAttachment.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';


interface ImageAttachmentProps {
  url: string;
  name: string;
  messageId: string;
  time?: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  isMine?: boolean;
  gridMode?: boolean;
  isVisible?: boolean;
}

export default function ImageAttachment({ url, name, messageId, time, readStatus, isMine, gridMode, isVisible = true }: ImageAttachmentProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [source, setSource] = useState<string | null>(url || null);

  useEffect(() => {
    // In gridMode, defer loading until it becomes visible
    if (!isVisible && gridMode) return;

    if (!url) {
      ConnectsService.getMessageAttachment(messageId).then((attachments) => {
        if (attachments && attachments.length > 0) {
           const att = attachments.find((a: any) => a.name === name) || attachments[0];
           setSource(att?.url || att?.file_url || "");
        }
      }).catch(err => console.log("Failed to load image base64", err));
    }
  }, [url, messageId, name, isVisible, gridMode]);

  if (!source || (!isVisible && gridMode)) {
    return (
      <View style={[styles.image, styles.loadingContainer, gridMode && { width: '100%', height: '100%', borderRadius: 0 }]}>
        {isVisible && <ActivityIndicator color={colors.brand.primary} />}
      </View>
    );
  }

  // Optimize expo-image decoding in grid mode by setting downsampling bounds
  const downsampleProps = gridMode ? { width: 150, height: 150 } : undefined;

  return (
    <View style={[styles.container, gridMode && { width: '100%', height: '100%', borderRadius: 0 }]}>
      <Image 
        source={downsampleProps ? { uri: source, ...downsampleProps } : { uri: source }} 
        style={[styles.image, gridMode && { width: '100%', height: '100%', borderRadius: 0 }]} 
        contentFit="cover" 
        cachePolicy="memory-disk" 
        transition={200}
      />
      {!gridMode && time && (
        <View style={styles.timeOverlay}>
          <AppText style={styles.timeText}>{time}</AppText>
          {isMine && readStatus && (
            <Ionicons
              name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
              size={14}
              color={readStatus === "read" ? colors.status.info : colors.text.inverse}
              style={styles.tickIcon}
            />
          )}
        </View>
      )}

      {/* Download Button Component Overlay */}
      {!gridMode && source ? (
        <View style={styles.downloadOverlay}>
          <DownloadButton url={source} filename={name} style={styles.downloadCircle} />
        </View>
      ) : null}
    </View>
  );
}
