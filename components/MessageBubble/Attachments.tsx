import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageAttachment from '../ImageAttachment';
import VideoAttachment from '../VideoAttachment';
import AudioAttachment from '../AudioAttachment';
import MediaGalleryModal from '../MediaGalleryModal';
import { MediaCacheManager } from '../../services/MediaCacheManager';
import { createStyles } from './Attachments.styles';
import { AppText } from '../ui/AppText';
import { useColors } from '../../design';

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
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

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

  const handleMediaPress = async (index: number) => {
    try {
      const state = await MediaCacheManager.getMediaState(messageId);
      if (state?.local_uri) {
        media.forEach(item => {
          if (!item.local_uri) item.local_uri = state.local_uri;
        });
      }
    } catch (e) {}
    setInitialIndex(index);
    setGalleryVisible(true);
  };

  const renderMediaGrid = () => {
    if (media.length === 0) return null;

    if (media.length === 1) {
      const file = media[0];
      const type = file.type || file.mime_type || "";
      const url = file.url || file.file_url || file.uri || file.local_uri;
      const name = file.name || "Attachment";
      
      if (type.startsWith("image/")) {
        return (
          <TouchableOpacity onPress={() => handleMediaPress(0)} activeOpacity={0.9}>
            <ImageAttachment url={url || ""} name={name} messageId={messageId} {...mediaProps} readStatus={mediaProps.readStatus as any} isVisible={isVisible} />
          </TouchableOpacity>
        );
      } else {
        return (
          <VideoAttachment url={url || ""} messageId={messageId} name={name} duration={file.duration} type="video" isVisible={isVisible} {...mediaProps} readStatus={mediaProps.readStatus as any} />
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
          const url = file.url || file.file_url || file.uri || file.local_uri;
          const name = file.name || "Attachment";

          if (type.startsWith("image/")) {
            return (
              <TouchableOpacity 
                key={index}
                style={styles.gridItem} 
                onPress={() => handleMediaPress(index)}
                activeOpacity={0.9}
              >
                <ImageAttachment url={url || ""} name={name} messageId={messageId} gridMode={true} isVisible={isVisible} />
                {index === 3 && extraCount > 0 && (
                  <View style={styles.extraOverlay}>
                    <AppText style={styles.extraText}>+{extraCount}</AppText>
                  </View>
                )}
                
                {index === displayMedia.length - 1 && showOverlayTime && (
                  <View style={[styles.timeOverlay, (index === 3 && extraCount > 0) ? { zIndex: 20 } : undefined]}>
                    <AppText style={styles.timeText}>{time}</AppText>
                    {isMine && readStatus && (
                      <Ionicons
                        name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
                        size={12}
                        color={readStatus === "read" ? colors.status.info : "#FFF"}
                        style={styles.tickIcon}
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          } else {
            return (
              <View key={index} style={styles.gridItem}>
                <VideoAttachment url={url || ""} messageId={messageId} name={name} duration={file.duration} type="video" gridMode={true} isVisible={isVisible} isMine={isMine} />
                {index === 3 && extraCount > 0 && (
                  <View style={styles.extraOverlay} pointerEvents="none">
                    <AppText style={styles.extraText}>+{extraCount}</AppText>
                  </View>
                )}
                
                {index === displayMedia.length - 1 && showOverlayTime && (
                  <View style={[styles.timeOverlay, (index === 3 && extraCount > 0) ? { zIndex: 20 } : undefined]} pointerEvents="none">
                    <AppText style={styles.timeText}>{time}</AppText>
                    {isMine && readStatus && (
                      <Ionicons
                        name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
                        size={12}
                        color={readStatus === "read" ? colors.status.info : "#FFF"}
                        style={styles.tickIcon}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          }
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
        const url = file.url || file.file_url || file.uri || file.local_uri;
        const name = file.name || "Attachment";
        
        if (type.startsWith("audio/")) {
          const duration = (file.duration ? file.duration * 1000 : 0) || file.durationMillis || 0;
          return <AudioAttachment key={`other-${index}`} url={url || ""} messageId={messageId} name={name} durationMillis={duration} isVisible={isVisible} {...mediaProps} readStatus={mediaProps.readStatus as any} />;
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


