import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { createStyles } from './AudioRecorder.styles';
import { useColors } from '../design';


interface Props {
  onRecordComplete: (uri: string, durationMillis: number) => void;
}

export default function AudioRecorder({ onRecordComplete }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      }
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    
    setIsRecording(false);
    setRecording(null);

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    const status = await recording.getStatusAsync();
    
    if (uri && status.durationMillis) {
      onRecordComplete(uri, status.durationMillis);
    }
  }

  return (
    <TouchableOpacity
      style={[styles.micButton, isRecording && styles.recordingActive]}
      onPressIn={startRecording}
      onPressOut={stopRecording}
      activeOpacity={0.7}
    >
      <Ionicons name="mic" size={24} color={isRecording ? colors.text.inverse : colors.text.muted} />
    </TouchableOpacity>
  );
}
