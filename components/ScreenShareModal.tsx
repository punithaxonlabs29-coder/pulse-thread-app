import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as IntentLauncher from "expo-intent-launcher";

import { useColors } from "../design";
import { AppText } from "./ui/AppText";
import { PendingAttachment } from "./AttachmentPreview";

interface ScreenShareModalProps {
  visible: boolean;
  onClose: () => void;
  onSendAttachment: (attachment: PendingAttachment) => void;
}

export default function ScreenShareModal({
  visible,
  onClose,
  onSendAttachment,
}: ScreenShareModalProps) {
  const colors = useColors();

  const [isRecording, setIsRecording] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      // Pulse animation for recording dot
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
      setSeconds(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const handleStartNow = async () => {
    let screenRecordingStarted = false;
    try {
      const Nitro = require("react-native-nitro-screen-recorder");
      if (Nitro && typeof Nitro.startGlobalRecording === "function") {
        try {
          const micStatus = Nitro.getMicrophonePermissionStatus ? Nitro.getMicrophonePermissionStatus() : "granted";
          if (micStatus !== "granted" && Nitro.requestMicrophonePermission) {
            await Nitro.requestMicrophonePermission();
          }
        } catch (mErr) {
          console.log("Mic perm check err:", mErr);
        }

        let consentGranted = false;
        if (typeof Nitro.requestScreenRecordingConsent === "function") {
          try {
            consentGranted = await Nitro.requestScreenRecordingConsent();
          } catch (cErr) {
            console.log("requestScreenRecordingConsent error:", cErr);
          }
        }

        try {
          Nitro.startGlobalRecording({
            options: {
              enableMic: true,
              usePreparedConsent: consentGranted,
            },
            onRecordingError: (err: any) => {
              console.log("Global screen recording error:", err);
            },
          });
          screenRecordingStarted = true;
        } catch (startErr) {
          console.log("startGlobalRecording direct error:", startErr);
        }
      }
    } catch (err) {
      console.log("NitroScreenRecorder start error:", err);
    }

    if (!screenRecordingStarted) {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(newRecording);
      } catch (e) {
        console.log("Audio recording setup error:", e);
      }
    }

    setIsRecording(true);
  };

  const handleStopRecording = async () => {
    if (isStopping) return;
    setIsStopping(true);
    setIsRecording(false);

    let videoUri = "";
    let durationSec = seconds;

    try {
      const Nitro = require("react-native-nitro-screen-recorder");
      if (Nitro && typeof Nitro.stopGlobalRecording === "function") {
        let file = await Nitro.stopGlobalRecording({ settledTimeMs: 300 });
        if (!file && typeof Nitro.retrieveLastGlobalRecording === "function") {
          file = Nitro.retrieveLastGlobalRecording();
        }
        if (file && file.path) {
          const rawPath = file.path;
          videoUri =
            rawPath.startsWith("file://") || rawPath.startsWith("content://")
              ? rawPath
              : `file://${rawPath}`;
        }
      }
    } catch (err) {
      console.log("NitroScreenRecorder stop error:", err);
    }

    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        if (!videoUri) {
          videoUri = recording.getURI() || "";
        }
      } catch (e) {
        console.log("Error stopping audio:", e);
      }
      setRecording(null);
    }

    if (videoUri) {
      const isVideo =
        videoUri.endsWith(".mp4") ||
        videoUri.includes("video") ||
        videoUri.endsWith(".mov");
      onSendAttachment({
        uri: videoUri,
        type: isVideo ? "video/mp4" : "audio/m4a",
        name: `screen_clip_${Date.now()}.${isVideo ? "mp4" : "m4a"}`,
        mimeType: isVideo ? "video/mp4" : "audio/m4a",
        duration: durationSec,
      });

      if (Platform.OS === "android") {
        ToastAndroid.show("Screen recording clip attached", ToastAndroid.SHORT);
      }
    }

    setIsStopping(false);
    onClose();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!visible && !isRecording) return null;

  return (
    <>
      {/* Active Screen Sharing Floating Top Bar (Google Meet Style) */}
      {isRecording && (
        <View style={styles.floatingBar}>
          <View style={styles.floatingLeft}>
            <Animated.View style={[styles.redDot, { opacity: pulseAnim }]} />
            <AppText style={styles.floatingTitle}>Screen Recording</AppText>
            <AppText style={styles.floatingTimer}>{formatTimer(seconds)}</AppText>
          </View>
          <TouchableOpacity
            style={[styles.stopButton, isStopping && { opacity: 0.6 }]}
            activeOpacity={0.6}
            onPress={handleStopRecording}
            disabled={isStopping}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            {isStopping ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
            ) : (
              <Ionicons name="stop-circle" size={22} color="#FFFFFF" style={{ marginRight: 4 }} />
            )}
            <AppText style={styles.stopButtonText}>
              {isStopping ? "Stopping..." : "Stop & Send Clip"}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Google Meet Style Permission / Start Modal */}
      <Modal
        visible={visible && !isRecording}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={styles.dialogContainer}>
            {/* Google Meet Share Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="desktop-outline" size={32} color="#1A73E8" />
            </View>

            <AppText style={styles.dialogTitle}>
              Start recording or casting with Pulse?
            </AppText>

            <AppText style={styles.dialogBody}>
              Pulse will have access to all of the information that is visible on
              your screen or played from your device while recording or casting. This
              includes information such as passwords, payment details, photos,
              messages, and audio.
            </AppText>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <AppText style={styles.cancelBtnText}>Cancel</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.startNowBtn}
                onPress={handleStartNow}
                activeOpacity={0.8}
              >
                <AppText style={styles.startNowText}>Start now</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dialogContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E8F0FE", // Light Google Blue
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#202124",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 26,
  },
  dialogBody: {
    fontSize: 14,
    color: "#5F6368",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A73E8",
  },
  startNowBtn: {
    backgroundColor: "#1A73E8", // Google Meet Blue
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  startNowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  floatingBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 48,
    left: 14,
    right: 14,
    zIndex: 99999,
    backgroundColor: "#202124",
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
  },
  floatingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  redDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EA4335", // Google Red
  },
  floatingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  floatingTimer: {
    color: "#9AA0A6",
    fontSize: 14,
    fontWeight: "700",
  },
  stopButton: {
    backgroundColor: "#EA4335", // Red Stop button
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    gap: 6,
  },
  stopButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
