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
import { SessionService } from '../services/session.service';
import { CONFIG } from '../constants/config';
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
  duration?: number | string;
}

const formatDuration = (dur?: number | string): string => {
  if (dur === undefined || dur === null) return '';
  const d = typeof dur === 'string' ? parseFloat(dur) : dur;
  if (isNaN(d) || d <= 0) return '';
  const secs = d > 1000 ? Math.floor(d / 1000) : Math.floor(d);
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default function VideoAttachment({ url, name, messageId, isMine, type = 'video', isVisible = false, time, readStatus, gridMode = false, duration }: VideoAttachmentProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isVideoModalVisible, setVideoModalVisible] = useState(false);
  const [isPdfModalVisible, setPdfModalVisible] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const attachmentId = `${messageId}_${name}`;

  useEffect(() => {
    let isMounted = true;
    
    const checkCacheAndGenerate = async () => {
      const state = await MediaCacheManager.getMediaState(attachmentId);
      if (state?.thumbnail_uri) {
        if (isMounted) setThumbnailUrl(state.thumbnail_uri);
        return;
      }
      
      if (!isVisible) return; // Do not generate if not visible

      try {
        const fileUri = await getCachedFile();
        if (fileUri && fileUri.startsWith('file://')) {
          const { uri } = await VideoThumbnails.getThumbnailAsync(fileUri, { time: 1000, quality: 0.5 });
          if (isMounted) setThumbnailUrl(uri);
          
          const fileInfo = await FileSystem.getInfoAsync(uri);
          await MediaCacheManager.saveThumbnail(attachmentId, fileUri, uri, fileInfo.exists ? fileInfo.size : 0);
        }
      } catch (e) {
        // Quietly fallback to default video icon
      }
    };

    if (type === 'video') {
      checkCacheAndGenerate();
    }
    
    return () => { isMounted = false; };
  }, [type, messageId, attachmentId, isVisible]);

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
    let rawUrl = typeof url === 'string' ? url : ((url as any)?.uri || (url as any)?.url || (url as any)?.file_url || (url as any)?.dat || String(url || ''));
    let cleanUri = rawUrl;
    const contentMatch = rawUrl.match(/(content:\/\/[^\s}]+)/);
    const fileMatch = rawUrl.match(/(file:\/\/[^\s}]+)/);
    const httpMatch = rawUrl.match(/(https?:\/\/[^\s}]+)/);

    if (contentMatch) cleanUri = contentMatch[1];
    else if (fileMatch) cleanUri = fileMatch[1];
    else if (httpMatch) cleanUri = httpMatch[1];

    // 1. Check MediaCacheManager SQLite DB
    const state = await MediaCacheManager.getMediaState(attachmentId);
    if (state?.local_uri) {
      const info = await FileSystem.getInfoAsync(state.local_uri);
      if (info.exists && info.size > 1024) return state.local_uri;
    }

    let filename = (name || `video_${messageId}`).replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (!filename.toLowerCase().endsWith('.mp4')) {
      filename += '.mp4';
    }

    // 2. Check FileSystem.documentDirectory (DownloadButton location)
    const docPath = `${FileSystem.documentDirectory}${filename}`;
    const docInfo = await FileSystem.getInfoAsync(docPath);
    if (docInfo.exists && docInfo.size > 1024) {
      await MediaCacheManager.saveMedia(attachmentId, cleanUri || '', docPath, docInfo.size, 'video');
      return docPath;
    }

    // 3. Check FileSystem.cacheDirectory (Cache location)
    const cachePath = `${FileSystem.cacheDirectory}cache/videos/${filename}`;
    const cacheInfo = await FileSystem.getInfoAsync(cachePath);
    if (cacheInfo.exists && cacheInfo.size > 1024) {
      await MediaCacheManager.saveMedia(attachmentId, cleanUri || '', cachePath, cacheInfo.size, 'video');
      return cachePath;
    }

    // 4. If not downloaded yet, resolve URL & download locally
    let finalUrl = cleanUri;
    if (!finalUrl || finalUrl.includes('/connects/message/attachment/')) {
      const attachments = await ConnectsService.getMessageAttachment(messageId);
      if (attachments && attachments.length > 0) {
        const att = attachments.find((a: any) => a.name === name) || attachments[0];
        finalUrl = att?.url || att?.file_url || att?.uri || '';
      }
    }

    // If finalUrl is a local content:// URI (sender device), stream to cachePath via fetch()
    if (finalUrl.startsWith('content://')) {
      try {
        const info = await FileSystem.getInfoAsync(cachePath);
        if (info.exists && info.size > 1024) return cachePath;

        console.log('Caching sender content:// URI to disk:', finalUrl);
        const res = await fetch(finalUrl);
        const blob = await res.blob();
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') resolve(reader.result.split(',')[1] || '');
            else reject(new Error('Failed to read blob'));
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        if (base64Data) {
          await FileSystem.writeAsStringAsync(cachePath, base64Data, { encoding: 'base64' });
          await MediaCacheManager.saveMedia(attachmentId, finalUrl, cachePath, blob.size, 'video');
          return cachePath;
        }
      } catch (err) {
        console.log('Failed to cache sender content:// URI:', err);
      }
    }

    // Normalize relative backend URLs dynamically using CONFIG
    if (!finalUrl.startsWith('http') && !finalUrl.startsWith('file:') && !finalUrl.startsWith('content:') && !finalUrl.startsWith('data:')) {
      const apiBase = CONFIG.API_BASE_URL.endsWith('/') ? CONFIG.API_BASE_URL : `${CONFIG.API_BASE_URL}/`;
      const domainBase = apiBase.replace(/\/api\/?$/, '');
      if (finalUrl.startsWith('/')) {
        finalUrl = `${domainBase}${finalUrl}`;
      } else {
        finalUrl = `${apiBase}${finalUrl}`;
      }
    }

    const dirPath = `${FileSystem.cacheDirectory}cache/videos/`;
    const dirInfo = await FileSystem.getInfoAsync(dirPath);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }

    const token = await SessionService.getToken();
    const isS3Url = finalUrl.includes('.amazonaws.com') || finalUrl.includes('.s3.');
    const downloadOptions = (!isS3Url && token) ? { headers: { Cookie: `sessionid=${token}` } } : {};

    if (finalUrl.startsWith('data:')) {
      const base64Data = finalUrl.split(',')[1];
      await FileSystem.writeAsStringAsync(cachePath, base64Data, { encoding: 'base64' });
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      await MediaCacheManager.saveMedia(messageId, finalUrl, cachePath, fileInfo.exists ? fileInfo.size : 0, 'video');
      return cachePath;
    } else if (finalUrl.startsWith('content://')) {
      try {
        const downloadRes = await FileSystem.downloadAsync(finalUrl, cachePath, downloadOptions);
        const fileInfo = await FileSystem.getInfoAsync(downloadRes.uri);
        await MediaCacheManager.saveMedia(messageId, finalUrl, downloadRes.uri, fileInfo.exists ? fileInfo.size : 0, 'video');
        return downloadRes.uri;
      } catch (e) {
        try {
          await FileSystem.copyAsync({ from: finalUrl, to: cachePath });
          return cachePath;
        } catch (err) {
          return null;
        }
      }
    } else if (finalUrl.startsWith('http')) {
      try {
        const success = await ConnectsService.downloadAttachmentBinary(finalUrl, cachePath);
        if (success) {
          const fileInfo = await FileSystem.getInfoAsync(cachePath);
          if (fileInfo.exists && fileInfo.size > 0) {
            await MediaCacheManager.saveMedia(messageId, finalUrl, cachePath, fileInfo.size, 'video');
            return cachePath;
          }
        }
        
        // Fallback to FileSystem.downloadAsync
        const downloaded = await FileSystem.downloadAsync(finalUrl, cachePath, downloadOptions);
        const fileContent = await FileSystem.readAsStringAsync(downloaded.uri, { length: 50 }).catch(() => '');
        if (fileContent.startsWith('{') || fileContent.startsWith('<html') || fileContent.startsWith('<!DOCTYPE')) {
          await FileSystem.deleteAsync(downloaded.uri, { idempotent: true });
          return null;
        }

        const fileInfo = await FileSystem.getInfoAsync(downloaded.uri);
        await MediaCacheManager.saveMedia(messageId, finalUrl, downloaded.uri, fileInfo.exists ? fileInfo.size : 0, 'video');
        return downloaded.uri;
      } catch (e) {
        return null;
      }
    }
    return finalUrl;
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
              <Text style={styles.videoDuration}> {formatDuration(duration) || '0:00'}</Text>
            </View>
          )}
          {!gridMode && time && (
            <View style={styles.timeOverlay}>
              {localUri || url ? (
                <DownloadButton url={localUri || url} filename={name} messageId={messageId} style={{ marginRight: 4 }} />
              ) : null}
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
              shouldPlay={true}
              isLooping={true}
              onError={(e) => console.log('Video Playback Error:', e)}
              onPlaybackStatusUpdate={(status) => {
                if (!status.isLoaded && (status as any).error) {
                  console.log('Playback Status Error:', (status as any).error);
                }
              }}
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

