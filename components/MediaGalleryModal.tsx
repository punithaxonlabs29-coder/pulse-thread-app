import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, Dimensions, SafeAreaView , FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ResizeMode, Video } from 'expo-av';
import DownloadButton from './ui/DownloadButton';
import { useColors, Colors } from '../design';
import { AppText } from './ui/AppText';

const { width, height } = Dimensions.get('window');

interface MediaGalleryModalProps {
  visible: boolean;
  media: any[];
  initialIndex: number;
  messageId: string;
  onClose: () => void;
}

export default function MediaGalleryModal({ visible, media, initialIndex, messageId, onClose }: MediaGalleryModalProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const type = item.type || item.mime_type || "";
    const isVideo = type.startsWith("video/") || item.name?.endsWith(".webm") || item.name?.endsWith(".mp4");
    
    // In a real app we'd fetch the exact local URI if missing, but we'll use url directly for gallery
    const uri = item.url || item.file_url;

    return (
      <View style={styles.pageContainer}>
        {isVideo ? (
          <Video
            source={{ uri }}
            style={styles.mediaItem}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={index === currentIndex}
          />
        ) : (
          <Image
            source={{ uri }}
            style={styles.mediaItem}
            contentFit="contain"
          />
        )}
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
          keyExtractor={(_, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
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
    top: 0,
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
  }
});
