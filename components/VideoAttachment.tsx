import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking } from 'react-native';

import { ConnectsService } from '../services/connects.service';

interface VideoAttachmentProps {
  url: string;
  name: string;
  messageId: string;
  isMine: boolean;
  type?: 'video' | 'audio' | 'document';
}

export default function VideoAttachment({ url, name, messageId, isMine, type = 'video' }: VideoAttachmentProps) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      let finalUrl = url;
      
      // If URL was stripped by backend (lightweight mode), fetch it now
      if (!finalUrl) {
        console.log("Fetching lazy attachment for message", messageId);
        const attachments = await ConnectsService.getMessageAttachment(messageId);
        if (attachments && attachments.length > 0) {
           const att = attachments.find((a: any) => a.name === name) || attachments[0];
           finalUrl = att?.url || att?.file_url || "";
        }
      }

      if (finalUrl.startsWith('data:')) {
        const base64Data = finalUrl.split(',')[1];
        const filename = name || `attachment_${Date.now()}`;
        const fileUri = FileSystem.cacheDirectory + filename;
        await FileSystem.writeAsStringAsync(fileUri, base64Data, {
          encoding: 'base64',
        });
        
        try {
          if (type === 'video') {
            const contentUri = await FileSystem.getContentUriAsync(fileUri);
            await Linking.openURL(contentUri);
          } else {
            const contentUri = await FileSystem.getContentUriAsync(fileUri);
            
            // Infer mimeType from extension
            const ext = filename.split('.').pop()?.toLowerCase();
            let mimeType = 'application/octet-stream';
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (ext === 'doc' || ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === 'xls' || ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            else if (ext === 'ppt' || ext === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            else if (ext === 'txt') mimeType = 'text/plain';
            else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'mp3' || ext === 'm4a' || ext === 'wav') mimeType = 'audio/*';

            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: contentUri,
              flags: 1,
              type: mimeType
            });
          }
        } catch (linkError) {
          console.log("Failed to open, falling back to share", linkError);
          await Sharing.shareAsync(fileUri);
        }
      } else if (finalUrl) {
        await Linking.openURL(finalUrl);
      }
    } catch (e) {
      console.log('Error opening file', e);
    } finally {
      setLoading(false);
    }
  };

  if (type === 'video') {
    return (
      <Pressable onPress={handlePress} style={styles.videoContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <View style={styles.playButtonCircle}>
            <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </View>
        )}
        <View style={styles.videoFooter}>
          <Text style={styles.videoDuration}>Video</Text>
        </View>
      </Pressable>
    );
  }

  let iconName = "document-text";
  if (type === 'audio') iconName = "musical-notes";

  return (
    <Pressable onPress={handlePress} style={[styles.documentContainer, isMine ? styles.myDocument : styles.otherDocument]}>
      <View style={[styles.iconBox, isMine ? styles.myIconBox : styles.otherIconBox]}>
        {loading ? (
          <ActivityIndicator size="small" color={isMine ? "#2563EB" : "#FFFFFF"} />
        ) : (
          <Ionicons name={iconName as any} size={24} color={isMine ? "#2563EB" : "#FFFFFF"} />
        )}
      </View>
      <View style={styles.documentInfo}>
        <Text style={[styles.fileName, isMine && styles.myFileName]} numberOfLines={1}>{name || 'Attachment'}</Text>
      </View>
      <View style={styles.downloadIcon}>
        <Ionicons name="download-outline" size={20} color={isMine ? "#DBEAFE" : "#9CA3AF"} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    width: 240,
    height: 180,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFooter: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 240,
  },
  myDocument: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  otherDocument: {
    backgroundColor: '#F3F4F6',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myIconBox: {
    backgroundColor: '#FFFFFF',
  },
  otherIconBox: {
    backgroundColor: '#2563EB',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    color: "#1F2937",
    fontWeight: "500",
    fontSize: 14,
  },
  myFileName: {
    color: "#FFFFFF",
  },
  downloadIcon: {
    padding: 4,
  }
});
