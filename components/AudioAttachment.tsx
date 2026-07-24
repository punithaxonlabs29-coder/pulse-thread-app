import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AudioPlayerManager from '../services/AudioPlayerManager';
import { MediaCacheManager } from '../services/MediaCacheManager';
import { ConnectsService } from '../services/connects.service';
import { createStyles } from './AudioAttachment.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';

interface AudioAttachmentProps {
  url: string;
  name: string;
  messageId: string;
  isMine: boolean;
  isVisible?: boolean;
  time?: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  durationMillis?: number;
}

// Generate a pseudo-random waveform based on string hash
const generateWaveform = (seed: string, count: number = 30) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bars = [];
  for (let i = 0; i < count; i++) {
    const pseudoRandom = Math.abs(Math.sin(hash + i));
    bars.push(Math.max(15, Math.floor(pseudoRandom * 100))); // Percentage height
  }
  return bars;
};

export default function AudioAttachment({ url, name, messageId, isMine, isVisible, time, readStatus, durationMillis }: AudioAttachmentProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [duration, setDuration] = useState(durationMillis || 0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const attachmentId = `${messageId}_${name}`;
  const waveformBars = React.useMemo(() => generateWaveform(attachmentId), [attachmentId]);

  useEffect(() => {
    // Poll AudioPlayerManager to see if we are still the active playing sound
    const interval = setInterval(() => {
      if (isPlaying && AudioPlayerManager.getCurrentAttachmentId() !== attachmentId) {
        setIsPlaying(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isPlaying, attachmentId]);

  // Clean up if component unmounts
  useEffect(() => {
    return () => {
      if (AudioPlayerManager.getCurrentAttachmentId() === attachmentId) {
        AudioPlayerManager.stopCurrent();
      }
    };
  }, [attachmentId]);

  // Update duration if prop changes
  useEffect(() => {
    if (durationMillis && durationMillis > 0 && duration === 0) {
      setDuration(durationMillis);
    }
  }, [durationMillis]);

  const getCachedFile = async (): Promise<string | null> => {
    const state = await MediaCacheManager.getMediaState(messageId);
    if (state?.local_uri) {
      return state.local_uri;
    }

    let finalUrl = url;
    if (!finalUrl) {
      const attachments = await ConnectsService.getMessageAttachment(messageId);
      if (attachments && attachments.length > 0) {
         const att = attachments.find((a: any) => a.name === name) || attachments[0];
         finalUrl = att?.url || att?.file_url || "";
      }
    }

    if (finalUrl.startsWith('data:')) {
      const base64Data = finalUrl.split(',')[1];
      let filename = name || `audio_${Date.now()}.m4a`;
      const fileUri = FileSystem.cacheDirectory + `cache/audios/${filename}`;
      
      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.cacheDirectory + 'cache/audios/');
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'cache/audios/', { intermediates: true });
      }

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: 'base64',
      });
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      await MediaCacheManager.saveMedia(messageId, finalUrl, fileUri, fileInfo.exists ? fileInfo.size : 0, 'audio');
      return fileUri;
    } else if (finalUrl) {
      return finalUrl;
    }
    return null;
  };

  const togglePlayback = async () => {
    try {
      if (isPlaying) {
        await AudioPlayerManager.pauseCurrent();
        setIsPlaying(false);
        return;
      }

      const fileUri = await getCachedFile();
      if (!fileUri) return;

      if (AudioPlayerManager.getCurrentAttachmentId() === attachmentId) {
        // Resume
        await AudioPlayerManager.resumeCurrent();
        setIsPlaying(true);
      } else {
        // Start fresh
        const sound = await AudioPlayerManager.play(attachmentId, fileUri, (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.durationMillis && status.positionMillis) {
              setProgress(status.positionMillis / status.durationMillis);
              setDuration(status.durationMillis);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setProgress(0);
            }
          }
        });
        soundRef.current = sound;
        setIsPlaying(true);
      }
    } catch (e) {
      console.log('Error playing audio', e);
    }
  };

  const formatDuration = (millis: number) => {
    if (!millis) return "0:00";
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const textStyle = isMine ? styles.textMine : styles.textOther;
  const barColor = isMine ? 'rgba(17, 24, 39, 0.35)' : 'rgba(0, 0, 0, 0.25)';
  const barActiveColor = colors.brand.primary;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={[styles.playButton, isMine ? styles.playButtonMine : styles.playButtonOther]} onPress={togglePlayback}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={20} color="#FFFFFF" style={{ marginLeft: isPlaying ? 0 : 2 }} />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.barsContainer}>
          {waveformBars.map((height, index) => {
            const isActive = (index / waveformBars.length) <= progress;
            return (
              <View 
                key={index} 
                style={[
                  styles.bar, 
                  { height: `${height}%`, backgroundColor: isActive ? barActiveColor : barColor }
                ]} 
              />
            );
          })}
        </View>

        <View style={styles.infoContainer}>
          <AppText style={[styles.durationText, textStyle]}>
            {formatDuration(duration || 0)}
          </AppText>
          
          <View style={styles.footerContainer}>
            {time && <AppText style={[styles.timeText, textStyle]}>{time}</AppText>}
            {isMine && readStatus && (
              <Ionicons
                name={readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"}
                size={14}
                color={readStatus === "read" ? "#3B82F6" : "#111827"}
                style={styles.tickIcon}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
