import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageAttachment from '../ImageAttachment';
import VideoAttachment from '../VideoAttachment';
import MediaGalleryModal from '../MediaGalleryModal';

interface AttachmentsProps {
  attachments?: any[];
  messageId: string;
  time: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  isMine: boolean;
  showOverlayTime: boolean;
  isVisible: boolean;
}

export const Attachments = React.memo(({ 
  attachments, 
  messageId, 
  time, 
  readStatus, 
  isMine, 
  showOverlayTime,
  isVisible 
}: AttachmentsProps) => {
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  if (!attachments || attachments.length === 0) return null;

  const media = attachments.filter(f => {
    const t = f.type || f.mime_type || "";
    return t.startsWith("image/") || t.startsWith("video/") || f.name?.endsWith(".webm") || f.name?.endsWith(".mp4");
  });

  const others = attachments.filter(f => !media.includes(f));

  const mediaProps = {
    time: showOverlayTime ? time : undefined,
    readStatus: showOverlayTime ? readStatus : undefined,
    isMine
  };

  const handleMediaPress = (index: number) => {
    setInitialIndex(index);
    setGalleryVisible(true);
  };

  const renderMediaGrid = () => {
    if (media.length === 0) return null;

    if (media.length === 1) {
      const file = media[0];
      const type = file.type || file.mime_type || "";
      const url = file.url || file.file_url;
      const name = file.name || "Attachment";
      
      if (type.startsWith("image/")) {
        return (
          <TouchableOpacity onPress={() => handleMediaPress(0)} activeOpacity={0.9}>
            <ImageAttachment url={url || ""} name={name} messageId={messageId} {...mediaProps} readStatus={mediaProps.readStatus as any} isVisible={isVisible} />
          </TouchableOpacity>
        );
      } else {
        return (
          <VideoAttachment url={url || ""} messageId={messageId} name={name} type="video" isVisible={isVisible} {...mediaProps} readStatus={mediaProps.readStatus as any} />
        );
      }
    }

    // Grid layout for 2+ media
    const displayMedia = media.slice(0, 4);
    const extraCount = media.length - 4;

    return (
      <View style={styles.gridContainer}>
        {displayMedia.map((file, index) => {
          const type = file.type || file.mime_type || "";
          const url = file.url || file.file_url;
          const name = file.name || "Attachment";

          return (
            <TouchableOpacity 
              key={index}
              style={styles.gridItem} 
              onPress={() => handleMediaPress(index)}
              activeOpacity={0.9}
            >
              {type.startsWith("image/") ? (
                <ImageAttachment url={url || ""} name={name} messageId={messageId} gridMode={true} isVisible={isVisible} />
              ) : (
                <VideoAttachment url={url || ""} messageId={messageId} name={name} type="video" gridMode={true} isVisible={isVisible} />
              )}
              {index === 3 && extraCount > 0 && (
                <View style={styles.extraOverlay}>
                  <Text style={styles.extraText}>+{extraCount}</Text>
                </View>
              )}
              
              {/* Shared overlay on bottom right item */}
              {index === displayMedia.length - 1 && showOverlayTime && (
                <View style={[styles.timeOverlay, (index === 3 && extraCount > 0) ? { zIndex: 20 } : undefined]}>
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
            </TouchableOpacity>
          );
        })}
        
        {/* Centralized Uploading/Sending Overlay */}
        {isMine && (readStatus === "sending" || readStatus === "pending") && (
          <View style={styles.uploadingCenterOverlay} pointerEvents="none">
            <View style={styles.uploadingCircle}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      {renderMediaGrid()}
      
      {others.map((file, index) => {
        const type = file.type || file.mime_type || "";
        const url = file.url || file.file_url;
        const name = file.name || "Attachment";
        
        if (type.startsWith("audio/")) {
          return <VideoAttachment key={`other-${index}`} url={url || ""} messageId={messageId} name={name} type="audio" isVisible={isVisible} {...mediaProps} readStatus={mediaProps.readStatus as any} />;
        }
        if (type.toLowerCase() === "link" || file.file_type === "Link") {
          return null;
        }
        return <VideoAttachment key={`other-${index}`} url={url || ""} messageId={messageId} name={name} type="document" {...mediaProps} readStatus={mediaProps.readStatus as any} />;
      })}

      {galleryVisible && (
        <MediaGalleryModal
          visible={galleryVisible}
          media={media}
          initialIndex={initialIndex}
          messageId={messageId}
          onClose={() => setGalleryVisible(false)}
        />
      )}
    </>
  );
}, (prev, next) => {
  return JSON.stringify(prev.attachments) === JSON.stringify(next.attachments) &&
         prev.isVisible === next.isVisible &&
         prev.showOverlayTime === next.showOverlayTime &&
         prev.readStatus === next.readStatus;
});

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260, // Fixed width to ensure stable 2x2 wrapping
    justifyContent: 'space-between',
    padding: 2,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridItem: {
    width: '49.5%',
    aspectRatio: 1,
    marginBottom: '1%',
    position: 'relative',
    overflow: 'hidden',
  },
  extraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  extraText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 5,
  },
  timeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  tickIcon: {
    marginLeft: 4,
  },
  uploadingCenterOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  uploadingCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(24, 115, 68, 0.8)', // WhatsApp style green circle
    justifyContent: 'center',
    alignItems: 'center',
  }
});
