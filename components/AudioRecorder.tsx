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
}

enum RecorderState {
  Idle,
  Recording,
  Paused,
  Stopping,
  Uploading,
  Finished
}

export default function AudioRecorder({ onRecordComplete }: Props) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [state, setState] = useState<RecorderState>(RecorderState.Idle);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [durationMillis, setDurationMillis] = useState(0);
  const [metering, setMetering] = useState<number[]>(Array(40).fill(-60));
  
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === RecorderState.Recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true })
        ])
      ).start();
    } else {
      blinkAnim.setValue(1);
      blinkAnim.stopAnimation();
    }
  }, [state, blinkAnim]);

  const handleToggleRecord = async () => {
    if (state === RecorderState.Idle || state === RecorderState.Finished) {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        setState(RecorderState.Recording);
        setDurationMillis(0);
        setMetering(Array(40).fill(-60));

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        newRecording.setProgressUpdateInterval(100);
        newRecording.setOnRecordingStatusUpdate((status) => {
          if (status.isRecording) {
            setDurationMillis(status.durationMillis);
            if (status.metering !== undefined) {
              setMetering(prev => {
                const next = [...prev];
                next.shift();
                next.push(status.metering as number);
                return next;
              });
            }
          }
        });

        setRecording(newRecording);
      } else {
        alert("Microphone permission denied.");
        setState(RecorderState.Idle);
      }
    } catch (err: any) {
      console.error('Failed to start recording', err);
      alert(`Recording failed: ${err.message || 'Unknown error'}`);
      setState(RecorderState.Idle);
    }
  };

  const handlePauseResume = async () => {
    if (!recording) return;
    
    if (state === RecorderState.Recording) {
      await recording.pauseAsync();
      setState(RecorderState.Paused);
    } else if (state === RecorderState.Paused) {
      await recording.startAsync();
      setState(RecorderState.Recording);
    }
  };

  const handleCancel = async () => {
    if (state === RecorderState.Idle || state === RecorderState.Finished) return;
    setState(RecorderState.Stopping);
    
    if (recording) {
      await recording.stopAndUnloadAsync();
      setRecording(null);
    }
    
    setState(RecorderState.Idle);
  };

  const handleSend = async () => {
    if (state === RecorderState.Idle || state === RecorderState.Finished) return;
    setState(RecorderState.Stopping);

    if (!recording) {
      setState(RecorderState.Idle);
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
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
      setRecording(null);
      setState(RecorderState.Finished);
      setTimeout(() => setState(RecorderState.Idle), 500);
    }
  };

  const formatDuration = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderWaveform = () => {
    return metering.map((val, i) => {
      const normalized = Math.max(0, (val + 60) / 60);
      const heightPercentage = 15 + (normalized * 85);
      return (
        <View 
          key={i} 
          style={[
            styles.bar, 
            { height: `${heightPercentage}%`, opacity: state === RecorderState.Paused ? 0.5 : 1 }
          ]} 
        />
      );
    });
  };

  const isModalVisible = state !== RecorderState.Idle && state !== RecorderState.Finished;

  return (
    <>
      <TouchableOpacity
        style={[styles.micButton]}
        onPress={handleToggleRecord}
        activeOpacity={0.7}
      >
        <Ionicons name="mic" size={24} color={colors.text.muted} />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={{ backgroundColor: colors.background.primary }}>
            <View style={styles.sheetContainer}>
              <View style={styles.sheetHandle} />

              <View style={styles.middleRow}>
                <AppText style={styles.timerText}>{formatDuration(durationMillis)}</AppText>
                
                <View style={styles.waveformContainer}>
                   {renderWaveform()}
                </View>
              </View>

              <View style={styles.bottomRow}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleCancel}>
                  <Ionicons name="trash-outline" size={24} color={colors.brand.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.pauseButton} onPress={handlePauseResume}>
                  <Ionicons name={state === RecorderState.Paused ? "play" : "pause"} size={20} color={colors.brand.primary} />
                  <AppText style={styles.pauseText}>
                    {state === RecorderState.Paused ? "Resume" : "Pause"}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                  <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
