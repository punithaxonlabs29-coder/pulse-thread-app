import React, { useState, useEffect, useRef } from 'react';
import DownloadButton from './ui/DownloadButton';
import { Pressable, Text, StyleSheet, View, ActivityIndicator, Modal, TouchableOpacity, Dimensions, Image , Linking } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

import { Video, ResizeMode, Audio } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import Pdf from 'react-native-pdf';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectsService } from '../services/connects.service';
import { MediaCacheManager } from '../services/MediaCacheManager';
import { createStyles } from './VideoAttachment.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';


const { width, height } = Dimensions.get('window');

// Global audio tracking to ensure only one plays at a time
let globalAudioSound: Audio.Sound | null = null;
let globalPlayingId: string | null = null;

interface VideoAttachmentProps {
  url: string;
  name: string;
  messageId: string;
  isMine: boolean;
  type?: 'video' | 'audio' | 'document' | 'link';
  isVisible?: boolean;
  time?: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  gridMode?: boolean;
}

export default function VideoAttachment({ url, name, messageId, isMine, type = 'video', isVisible = false, time, readStatus, gridMode = false }: VideoAttachmentProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isVideoModalVisible, setVideoModalVisible] = useState(false);
  const [isPdfModalVisible, setPdfModalVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(url || null);

  const attachmentId = `${messageId}_${name}`;

  useEffect(() => {
    let isMounted = true;
    
    const checkCacheAndGenerate = async () => {
      const state = await MediaCacheManager.getMediaState(messageId);
      if (state?.thumbnail_uri) {
        if (isMounted) setThumbnailUrl(state.thumbnail_uri);
        return;
      }
      
      if (!isVisible) return; // Do not generate if not visible

      try {
        const fileUri = await getCachedFile();
        if (fileUri) {
          const { uri } = await VideoThumbnails.getThumbnailAsync(fileUri, { time: 1000, quality: 0.5 });
          if (isMounted) setThumbnailUrl(uri);
          
          const fileInfo = await FileSystem.getInfoAsync(uri);
          await MediaCacheManager.saveThumbnail(messageId, fileUri, uri, fileInfo.exists ? fileInfo.size : 0);
        }
      } catch (e) {
        console.log('Video thumbnail error:', e);
      }
    };

    if (type === 'video') {
      checkCacheAndGenerate();
    }
    
    return () => { isMounted = false; };
  }, [type, messageId, isVisible]);

  // Cleanup local state if global audio changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (type === 'audio') {
        if (globalPlayingId !== attachmentId && isPlayingAudio) {
          setIsPlayingAudio(false);
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [type, isPlayingAudio, attachmentId]);

  const getCachedFile = async (): Promise<string | null> => {
    const state = await MediaCacheManager.getMediaState(messageId);
    if (state?.local_uri) {
      return state.local_uri;
    }

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
      let filename = name || `attachment_${Date.now()}`;
      if (type === 'video' && !filename.toLowerCase().endsWith('.mp4')) {
        filename += '.mp4';
      }
      const dirPath = `${FileSystem.cacheDirectory}cache/videos/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
      const fileUri = `${dirPath}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      await MediaCacheManager.saveMedia(messageId, finalUrl, fileUri, fileInfo.exists ? fileInfo.size : 0, 'video');
      return fileUri;
    } else if (finalUrl) {
      return finalUrl; // Already a URL
    }
    return null;
  };

  const handleAudioPlayback = async (fileUri: string) => {
    try {
      if (globalPlayingId === attachmentId && isPlayingAudio) {
        // Pause current audio
        await globalAudioSound?.pauseAsync();
        setIsPlayingAudio(false);
        globalPlayingId = null;
        return;
      }

      if (globalAudioSound) {
        await globalAudioSound.stopAsync();
        await globalAudioSound.unloadAsync();
        globalAudioSound = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: fileUri },
        { shouldPlay: true }
      );
      globalAudioSound = sound;
      globalPlayingId = attachmentId;
      setIsPlayingAudio(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingAudio(false);
          globalPlayingId = null;
        }
      });
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const handleDocumentOpen = async (fileUri: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    
    // In-app PDF Viewer
    if (ext === 'pdf') {
      setLocalUri(fileUri);
      setPdfModalVisible(true);
      return;
    }

    // Other documents: Try Intent Launcher, fallback to Share Sheet
    try {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      let mimeType = 'application/octet-stream';
      if (ext === 'doc' || ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === 'xls' || ext === 'xlsx') mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (ext === 'ppt' || ext === 'pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (ext === 'txt') mimeType = 'text/plain';
      else if (ext === 'zip') mimeType = 'application/zip';
      else if (ext === 'apk') mimeType = 'application/vnd.android.package-archive';

      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: mimeType
      });
    } catch (e) {
      console.log("IntentLauncher failed, falling back to Share sheet", e);
      await Sharing.shareAsync(fileUri);
    }
  };

  const handlePress = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const fileUri = await getCachedFile();
      if (!fileUri) throw new Error("Failed to load file URI");

      if (type === 'video') {
        setLocalUri(fileUri);
        setVideoModalVisible(true);
      } else if (type === 'audio') {
        await handleAudioPlayback(fileUri);
      } else if (type === 'link') {
        await Linking.openURL(fileUri);
      } else {
        await handleDocumentOpen(fileUri);
      }
    } catch (e) {
      console.log('Error opening file', e);
    } finally {
      setLoading(false);
    }
  };

  if (type === 'video') {
    return (
      <>
        <Pressable onPress={handlePress} style={[styles.videoContainer, gridMode && { width: '100%', height: '100%', borderRadius: 0, marginTop: 0 }]}>
          {thumbnailUrl && isVisible ? (
            <Image
              source={gridMode ? { uri: thumbnailUrl, width: 150, height: 150 } : { uri: thumbnailUrl }}
              style={[StyleSheet.absoluteFill, { borderRadius: gridMode ? 0 : 12 }]}
              resizeMode="cover"
            />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: thumbnailUrl ? 'rgba(0,0,0,0.2)' : '#1F2937', borderRadius: gridMode ? 0 : 12 }]} />
          {loading ? (
            <ActivityIndicator size="large" color="#FFFFFF" />
          ) : (
            <View style={styles.playButtonCircle}>
              <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </View>
          )}
          {!gridMode && (
            <View style={styles.videoFooter}>
              <Ionicons name="videocam" size={14} color="#FFF" />
              <Text style={styles.videoDuration}> 0:11</Text>
            </View>
          )}
          {!gridMode && url ? (
            <View style={styles.downloadOverlay}>
              <DownloadButton url={url} filename={name} style={styles.downloadCircle} />
            </View>
          ) : null}
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
        </Pressable>

        <Modal visible={isVideoModalVisible} transparent={false} animationType="fade" onRequestClose={() => setVideoModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity onPress={() => setVideoModalVisible(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text.inverse} />
          </TouchableOpacity>
          {localUri && (
            <Video
              source={{ uri: localUri }}
              style={styles.fullScreenVideo}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* PDF Modal */}
      <Modal visible={isPdfModalVisible} transparent={false} animationType="slide" onRequestClose={() => setPdfModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity onPress={() => setPdfModalVisible(false)} style={styles.pdfCloseButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <AppText style={styles.pdfTitle} numberOfLines={1}>{name}</AppText>
          </View>
          {localUri && (
            <Pdf
              source={{ uri: localUri, cache: true }}
              style={styles.pdfViewer}
              onError={(error) => console.log('PDF Viewer Error:', error)}
            />
          )}
        </SafeAreaView>
      </Modal>
      </>
    );
  }

  if (type === 'audio') {
    return (
      <View style={styles.audioContainer}>
        <View style={styles.audioAvatarContainer}>
          <Ionicons name="person-circle" size={48} color="#9CA3AF" />
          <View style={styles.audioMicBadge}>
            <Ionicons name="mic" size={10} color="#FFF" />
          </View>
        </View>
        
        <Pressable onPress={handlePress} style={styles.audioPlayButton}>
          {loading ? (
            <ActivityIndicator size="small" color="#111" />
          ) : (
            <Ionicons name={isPlayingAudio ? "pause" : "play"} size={28} color="#111" />
          )}
        </Pressable>
                <View style={styles.audioWaveformContainer}>
            <View style={styles.audioWaveform}>
              <View style={[styles.audioDot, isPlayingAudio && { backgroundColor: colors.brand.primary }]} />
              {[...Array(20)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.waveformBar, 
                    { height: Math.max(4, Math.random() * 16) },
                    isPlayingAudio && { backgroundColor: colors.brand.primary }
                  ]} 
                />
              ))}
            </View>
            <AppText style={styles.audioDurationText}>0:00</AppText>
          </View>
      </View>
    );
  }

  // Document / Link UI
  const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
  const isLink = type === 'link';
  const displayExt = isLink ? 'LINK' : ext.substring(0, 4);

  return (
    <>
      <Pressable onPress={isLink && url ? () => Linking.openURL(url) : handlePress} style={styles.documentCard}>
        {loading && !isLink && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#F97316" />
          </View>
        )}
        <View style={[styles.documentCardTop, isMine ? styles.myDocumentTop : styles.otherDocumentTop]}>
          <View style={[styles.iconBox, isMine ? styles.myIconBox : styles.otherIconBox]}>
            <Ionicons name="document-text" size={24} color={isMine ? colors.brand.primary : colors.text.inverse} />
          </View>
          <View style={styles.documentInfo}>
            <AppText style={[styles.documentCardName, isMine ? styles.myFileName : undefined]} numberOfLines={1}>
              {name}
            </AppText>
            <AppText style={styles.documentCardMeta}>{isLink ? 'Web Link' : `1 page • ${ext} • 141 kB`}</AppText>
          </View>
        </View>
        {time && !isLink && (
          <View style={styles.docTimeOverlay}>
            <Text style={styles.docTimeText}>{time}</Text>
            {isMine && readStatus && (
              <Ionicons
                name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
                size={14}
                color={readStatus === "read" ? "#53BDEB" : "#8696A0"}
                style={styles.tickIcon}
              />
            )}
          </View>
        )}
        <View style={[styles.documentCardBottom, isMine ? styles.myDocumentBottom : styles.otherDocumentBottom]}>
          {isLink ? (
            <Text style={[styles.documentActionText, isMine ? styles.myActionText : styles.otherActionText]}>
              Open Link
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', paddingHorizontal: 40 }}>
              <Text style={[styles.documentActionText, isMine ? styles.myActionText : styles.otherActionText]}>Open</Text>
              <Text style={[styles.documentActionText, isMine ? styles.myActionText : styles.otherActionText]}>Save as...</Text>
            </View>
          )}
        </View>
      </Pressable>

      <Modal visible={isPdfModalVisible} animationType="slide" transparent={false} onRequestClose={() => setPdfModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.pdfHeader}>
             <TouchableOpacity style={styles.pdfCloseButton} onPress={() => setPdfModalVisible(false)}>
               <Ionicons name="arrow-back" size={24} color="#111" />
             </TouchableOpacity>
             <Text style={styles.pdfTitle} numberOfLines={1}>{name}</Text>
             <TouchableOpacity onPress={() => Sharing.shareAsync(localUri!)}>
               <Ionicons name="share-outline" size={24} color="#111" />
             </TouchableOpacity>
          </View>
          {localUri && (
            <Pdf
              source={{ uri: localUri, cache: true }}
              style={styles.pdfViewer}
              onError={(error) => console.log('PDF Viewer Error:', error)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

