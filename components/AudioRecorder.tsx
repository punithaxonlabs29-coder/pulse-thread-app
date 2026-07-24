import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { createStyles } from './AudioRecorder.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';

export interface AudioRecordingResult {
  uri: string;
  durationMillis: number;
  size: number;
  mimeType: string;
  local_audio_id: string;
}

interface Props {
  onRecordComplete: (recording: AudioRecordingResult) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
}

enum RecorderState {
  Idle,
  Recording,
  Paused,
  Stopping,
  Uploading,
  Finished
}

export default function AudioRecorder({ onRecordComplete, onRecordingStateChange }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [state, setState] = useState<RecorderState>(RecorderState.Idle);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [durationMillis, setDurationMillis] = useState(0);

  const NUM_BARS = 48;
  const [meteringHistory, setMeteringHistory] = useState<number[]>(Array(NUM_BARS).fill(6));
  const isPreparingRef = useRef(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startRecording = async () => {
    if (isPreparingRef.current) return;
    isPreparingRef.current = true;

    try {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
        } catch (e) {}
        recordingRef.current = null;
        setRecording(null);
      }

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        setState(RecorderState.Recording);
        if (onRecordingStateChange) onRecordingStateChange(true);
        setDurationMillis(0);
        setMeteringHistory(Array(NUM_BARS).fill(6));

        const { recording: newRecording } = await Audio.Recording.createAsync({
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        });

        newRecording.setProgressUpdateInterval(80);
        newRecording.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording) {
            setDurationMillis(status.durationMillis);

            if (status.metering !== undefined) {
              // Convert dB level (-160 to 0) to dynamic bar height (6px to 46px)
              const db = status.metering;
              const normalizedHeight = Math.max(6, Math.min(46, (db + 60) * 0.8 + (Math.random() * 4)));
              
              setMeteringHistory((prev) => [...prev.slice(1), normalizedHeight]);
            }
          }
        });

        recordingRef.current = newRecording;
        setRecording(newRecording);
      } else {
        alert("Microphone permission denied.");
        setState(RecorderState.Idle);
        if (onRecordingStateChange) onRecordingStateChange(false);
      }
    } catch (err: any) {
      console.error('Failed to start recording', err);
      setState(RecorderState.Idle);
      if (onRecordingStateChange) onRecordingStateChange(false);
    } finally {
      isPreparingRef.current = false;
    }
  };

  const pauseRecording = async () => {
    const activeRec = recordingRef.current || recording;
    if (!activeRec) return;
    try {
      if (state === RecorderState.Recording) {
        await activeRec.pauseAsync();
        setState(RecorderState.Paused);
      } else if (state === RecorderState.Paused) {
        await activeRec.startAsync();
        setState(RecorderState.Recording);
      }
    } catch (e) {
      console.error('Error toggling pause', e);
    }
  };

  const handleCancel = async () => {
    setState(RecorderState.Stopping);
    if (onRecordingStateChange) onRecordingStateChange(false);

    const recToStop = recordingRef.current || recording;
    if (recToStop) {
      try {
        await recToStop.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
      setRecording(null);
    }

    setState(RecorderState.Idle);
  };

  const handleSend = async () => {
    if (onRecordingStateChange) onRecordingStateChange(false);
    setState(RecorderState.Stopping);

    const recToSend = recordingRef.current || recording;
    if (!recToSend) {
      setState(RecorderState.Idle);
      return;
    }

    try {
      await recToSend.stopAndUnloadAsync();
      const uri = recToSend.getURI();
      setState(RecorderState.Uploading);

      if (uri) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const size = fileInfo.exists ? fileInfo.size : 0;
        const localId = `local_audio_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        
        onRecordComplete({
          uri,
          durationMillis,
          size,
          mimeType: 'audio/m4a',
          local_audio_id: localId
        });
      }
    } catch (e) {
      console.log("Error sending recording", e);
    } finally {
      recordingRef.current = null;
      setRecording(null);
      setState(RecorderState.Finished);
      setTimeout(() => setState(RecorderState.Idle), 300);
    }
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isRecordingActive = state === RecorderState.Recording || state === RecorderState.Paused || state === RecorderState.Stopping;

  return (
    <>
      <TouchableOpacity
        style={styles.micButton}
        activeOpacity={0.7}
        onPress={startRecording}
        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
      >
        <Ionicons name="mic" size={22} color={colors.bubble.own.text} />
      </TouchableOpacity>

      {/* Bottom Sheet Audio Recording Modal */}
      <Modal
        visible={isRecordingActive}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            {/* Sheet Handle Indicator */}
            <View style={styles.sheetHandle} />

            {/* Middle Section: Duration Timer + Live Audio Waveform in a Row */}
            <View style={styles.middleRow}>
              <AppText style={styles.timerText}>{formatDuration(durationMillis)}</AppText>

              <View style={styles.waveformContainer}>
                {meteringHistory.map((height, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.bar,
                      { height }
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Bottom Row: Trash / Cancel, Pause / Resume, and Send */}
            <View style={styles.bottomRow}>
              {/* Trash / Cancel Button */}
              <TouchableOpacity style={styles.deleteButton} onPress={handleCancel}>
                <Ionicons name="trash-outline" size={24} color={colors.brand.primary} />
              </TouchableOpacity>

              {/* Pause / Resume Button */}
              <TouchableOpacity style={styles.pauseButton} onPress={pauseRecording}>
                <Ionicons
                  name={state === RecorderState.Paused ? "play" : "pause"}
                  size={20}
                  color={colors.brand.primary}
                />
                <AppText style={styles.pauseText}>
                  {state === RecorderState.Paused ? "Resume" : "Pause"}
                </AppText>
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Ionicons name="send" size={24} color={colors.text.inverse} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
