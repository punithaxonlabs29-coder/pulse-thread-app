import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from "@expo/vector-icons";
import { ConnectsService } from '../services/connects.service';
import * as FileSystem from 'expo-file-system/legacy';
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

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (source && source.startsWith('http')) {
      Image.prefetch(source).catch(() => {});
    }
  }, [source]);

  useEffect(() => {
    // In gridMode, defer loading until it becomes visible
    if (!isVisible && gridMode) return;

    if (fetchedRef.current) return;

    const loadAndCacheImage = async () => {
      let targetUrl = url;
      if (!targetUrl && messageId && messageId.startsWith('MSG_')) {
        fetchedRef.current = true;
        const attachments = await ConnectsService.getMessageAttachment(messageId);
        if (attachments && attachments.length > 0) {
          const att = attachments.find((a: any) => a.name === name) || attachments[0];
          targetUrl = att?.url || att?.file_url || "";
        }
      }

      if (targetUrl) {
        if (targetUrl.startsWith('data:')) {
          try {
            const parts = targetUrl.split(',');
            if (parts.length > 1) {
              const cleanBase64 = parts[1];
              const safeName = `${messageId}_${(name || 'image').replace(/[^a-zA-Z0-9_.-]/g, '_')}.jpg`;
              const filePath = `${FileSystem.cacheDirectory}cache/images/${safeName}`;
              const fileInfo = await FileSystem.getInfoAsync(filePath);
              if (!fileInfo.exists) {
                await FileSystem.writeAsStringAsync(filePath, cleanBase64, { encoding: 'base64' });
              }
              setSource(filePath);
              return;
            }
          } catch (e) {
            console.log("Failed to cache base64 image", e);
          }
        }
        setSource(targetUrl);
      }
    };

    loadAndCacheImage();
  }, [messageId, url, isVisible, gridMode]);

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
              color={readStatus === "read" ? "#3B82F6" : colors.text.inverse}
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
