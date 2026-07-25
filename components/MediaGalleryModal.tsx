import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Dimensions, SafeAreaView , FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as FileSystem from 'expo-file-system/legacy';

import { ResizeMode, Video } from 'expo-av';
import DownloadButton from './ui/DownloadButton';
import { useColors, Colors } from '../design';
import { AppText } from './ui/AppText';
import { MediaCacheManager } from '../services/MediaCacheManager';
import { SessionService } from '../services/session.service';
import { ConnectsService } from '../services/connects.service';

const { width, height } = Dimensions.get('window');

interface MediaGalleryModalProps {
  visible: boolean;
  media: any[];
  initialIndex: number;
  messageId: string;
  onClose: () => void;
}

function GalleryImageItem({ uri, thumbnailUri, styles }: { uri: string; thumbnailUri?: string; styles: any }) {
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.pageContainer}>
      <Image
        source={{ uri }}
        placeholder={thumbnailUri && thumbnailUri !== uri ? { uri: thumbnailUri } : undefined}
        style={styles.mediaItem}
        contentFit="contain"
        transition={100}
        cachePolicy="memory-disk"
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}

function GalleryVideoItem({ item, shouldPlay, styles, messageIdProp }: { item: any; shouldPlay: boolean; styles: any; messageIdProp?: string }) {
  const [videoUri, setVideoUri] = useState<string | null>(item.local_uri || item.localUri || null);

  useEffect(() => {
    let isMounted = true;
    const resolveVideo = async () => {
      let uri = item.local_uri || item.localUri || item.url || item.file_url || item.uri;
      const messageId = item.message_id || item.messageId || messageIdProp || '';

      if (messageId) {
        const state = await MediaCacheManager.getMediaState(messageId);
        if (state?.local_uri) {
          const info = await FileSystem.getInfoAsync(state.local_uri);
          if (info.exists && info.size > 0) {
            if (isMounted) setVideoUri(state.local_uri);
            return;
          }
        }
      }

      // If uri is empty or is the backend attachment query URL, fetch actual attachment object
      if ((!uri || uri.includes('/connects/message/attachment/')) && messageId) {
        const attachments = await ConnectsService.getMessageAttachment(messageId);
        if (attachments && attachments.length > 0) {
          const att = attachments.find((a: any) => a.name === item.name) || attachments[0];
          uri = att?.url || att?.file_url || att?.uri || "";
        }
      }

      if (!uri) return;

      const safeName = `${messageId}_${(item.name || 'video').replace(/[^a-zA-Z0-9_.-]/g, '_')}.mp4`;
      const cachePath = `${FileSystem.cacheDirectory}cache/videos/${safeName}`;

      // Handle Base64 video payloads directly
      if (uri.startsWith('data:')) {
        try {
          const parts = uri.split(',');
          if (parts.length > 1) {
            const cleanBase64 = parts[1];
            await FileSystem.writeAsStringAsync(cachePath, cleanBase64, { encoding: 'base64' });
            if (isMounted) setVideoUri(cachePath);
            return;
          }
        } catch (e) {}
      }

      // Handle Remote HTTP video files
      if (uri.startsWith('http')) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(cachePath);
          if (fileInfo.exists && fileInfo.size > 0) {
            if (isMounted) setVideoUri(cachePath);
            return;
          }

          const success = await ConnectsService.downloadAttachmentBinary(uri, cachePath);
          if (success) {
            const downloadedInfo = await FileSystem.getInfoAsync(cachePath);
            if (downloadedInfo.exists && downloadedInfo.size > 0) {
              if (isMounted) setVideoUri(cachePath);
              return;
            }
          }

          const token = await SessionService.getToken();
          const headers = token ? { headers: { Cookie: `sessionid=${token}` } } : {};
          const downloaded = await FileSystem.downloadAsync(uri, cachePath, headers);
          const check = await FileSystem.readAsStringAsync(downloaded.uri, { length: 50 }).catch(() => '');
          if (!check.startsWith('{') && !check.startsWith('<html') && !check.startsWith('<!DOCTYPE')) {
            if (isMounted) setVideoUri(downloaded.uri);
            return;
          }
        } catch (e) {}
      }

      if (isMounted) setVideoUri(uri);
    };

    resolveVideo();
    return () => { isMounted = false; };
  }, [item]);

  const thumbnailUri = item.thumbnail_uri || item.thumbnailUrl || item.thumbnail_url;

  if (!videoUri) {
    return (
      <View style={styles.pageContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <Video
        source={{ uri: videoUri }}
        style={styles.mediaItem}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        usePoster={!!thumbnailUri}
        posterSource={thumbnailUri ? { uri: thumbnailUri } : undefined}
        posterStyle={{ resizeMode: 'contain' }}
        shouldPlay={shouldPlay}
        isLooping={true}
      />
    </View>
  );
}

export default function MediaGalleryModal({ visible, media, initialIndex, messageId, onClose }: MediaGalleryModalProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const type = item.type || item.mime_type || "";
    const isVideo = type.startsWith("video/") || item.name?.endsWith(".webm") || item.name?.endsWith(".mp4");
    const uri = item.local_uri || item.localUri || item.url || item.file_url || item.uri;
    const thumbnailUri = item.thumbnail_uri || item.thumbnailUrl || item.thumbnail_url || (uri && !uri.startsWith('data:') ? uri : undefined);

    if (isVideo) {
      return <GalleryVideoItem item={item} shouldPlay={index === currentIndex} styles={styles} messageIdProp={messageId} />;
    }

    return (
      <View style={styles.pageContainer}>
        <GalleryImageItem uri={uri} thumbnailUri={thumbnailUri} styles={styles} />
      </View>
    );
  };

  const currentMedia = media[currentIndex];
  const currentUrl = currentMedia?.url || currentMedia?.file_url || currentMedia?.uri;
  const currentName = currentMedia?.name || `Attachment_${currentIndex}`;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={28} color={colors.text.inverse} />
          </TouchableOpacity>
          <AppText style={styles.titleText}>
            {currentIndex + 1} of {media.length}
          </AppText>
          <View style={styles.headerRight}>
             {currentUrl ? <DownloadButton url={currentUrl} filename={currentName} /> : null}
          </View>
        </View>

        <FlatList
          data={media}
          keyExtractor={(item, index) => item.id || item.name || index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          windowSize={3}
          removeClippedSubviews={true}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          renderItem={renderItem}
        />
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Media viewer should always have a black background, regardless of theme
  },
  header: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,

    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.45)', // Overlay should also be theme agnostic for media viewer
  },
  closeButton: {
    padding: 8,
  },
  titleText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
  headerRight: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pageContainer: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaItem: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
