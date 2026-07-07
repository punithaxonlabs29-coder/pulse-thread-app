import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface Props {
  onRecordComplete: (uri: string, durationMillis: number) => void;
}

export default function AudioRecorder({ onRecordComplete }: Props) {
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
      <Ionicons name="mic" size={24} color={isRecording ? "#FFF" : "#6B7280"} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    borderRadius: 20,
  },
  recordingActive: {
    backgroundColor: '#EF4444',
  }
});
