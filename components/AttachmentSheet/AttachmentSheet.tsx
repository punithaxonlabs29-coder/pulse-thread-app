import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";

import { useColors } from "../../design";
import AttachmentHeader from "./AttachmentHeader";
import RecentGallery from "./RecentGallery";
import { PendingAttachment } from "../AttachmentPreview";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.82;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (
    option: any
  ) => void;
  onSendMediaBatch: (
    attachments: PendingAttachment[],
    caption?: string
  ) => void;
  onEditMediaBatch: (
    attachments: PendingAttachment[],
    caption?: string
  ) => void;
  isDealChat?: boolean;
}

export default function AttachmentSheet({
  visible,
  onClose,
  onSelectOption,
  onSendMediaBatch,
  onEditMediaBatch,
  isDealChat = false,
}: Props) {
  const colors = useColors();
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [selectedAssets, setSelectedAssets] = useState<MediaLibrary.Asset[]>([]);
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (visible) {
      setSelectedAssets([]);
      setCaption("");
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleSelectAsset = (asset: MediaLibrary.Asset) => {
    setSelectedAssets((prev) => {
      const exists = prev.some((a) => a.id === asset.id);
      if (exists) {
        return prev.filter((a) => a.id !== asset.id);
      } else {
        return [...prev, asset];
      }
    });
  };

  const convertSelectedToAttachments = (): PendingAttachment[] => {
    return selectedAssets.map((asset) => ({
      uri: asset.uri,
      type: "image/jpeg",
      mimeType: "image/jpeg",
      name: asset.filename || `photo_${Date.now()}.jpg`,
    }));
  };

  const handleDirectSend = () => {
    if (selectedAssets.length === 0) return;
    const attachments = convertSelectedToAttachments();
    onSendMediaBatch(attachments, caption);
    onClose();
  };

  const handleEditBatch = () => {
    if (selectedAssets.length === 0) return;
    const attachments = convertSelectedToAttachments();
    onEditMediaBatch(attachments, caption);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "#000", opacity: backdropOpacity },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: "#FFFFFF" },
          { transform: [{ translateY }] },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Drag Handle Pill */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Option Grid */}
          <AttachmentHeader onSelectOption={onSelectOption} isDealChat={isDealChat} />

          {/* Media Grid */}
          <View style={styles.gridContainer}>
            <RecentGallery
              selectedAssets={selectedAssets}
              onToggleSelectAsset={toggleSelectAsset}
            />
          </View>

          {/* Bottom Bar when media selected */}
          {selectedAssets.length > 0 && (
            <View style={styles.bottomBar}>
              {/* Left Edit Icon with Badge */}
              <TouchableOpacity
                style={styles.editBtnContainer}
                onPress={handleEditBatch}
              >
                <View style={styles.editThumbnailFrame}>
                  <Image
                    source={{ uri: selectedAssets[selectedAssets.length - 1].uri }}
                    style={styles.editThumbnail}
                  />
                  <View style={styles.editPencilOverlay}>
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Center Caption Input */}
              <View style={styles.captionInputContainer}>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add a caption..."
                  placeholderTextColor="#94A3B8"
                  value={caption}
                  onChangeText={setCaption}
                />
              </View>

              {/* Right Orange Send Button with Badge */}
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleDirectSend}
              >
                <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 2 }} />
                {selectedAssets.length > 0 && (
                  <View style={styles.sendBadge}>
                    <Text style={styles.sendBadgeText}>{selectedAssets.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: "hidden",
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },
  gridContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  editBtnContainer: {
    padding: 2,
  },
  editThumbnailFrame: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#F1F5F9",
  },
  editThumbnail: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  editPencilOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  captionInputContainer: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  captionInput: {
    color: "#0F172A",
    fontSize: 15,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  sendBadge: {
    position: "absolute",
    top: -3,
    left: -3,
    backgroundColor: "#F97316",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  sendBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});