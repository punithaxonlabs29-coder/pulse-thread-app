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
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (
    option: "camera" | "gallery" | "document" | "video"
  ) => void;
  onSendMediaBatch: (
    attachments: PendingAttachment[],
    caption?: string
  ) => void;
  onEditMediaBatch: (
    attachments: PendingAttachment[],
    caption?: string
  ) => void;
}

export default function AttachmentSheet({
  visible,
  onClose,
  onSelectOption,
  onSendMediaBatch,
  onEditMediaBatch,
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
          { backgroundColor: "#121b22" },
          { transform: [{ translateY }] },
        ]}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Top header bar */}
          <View style={styles.topHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recents</Text>
            <View style={{ width: 24 }} />
          </View>

          <AttachmentHeader onSelectOption={onSelectOption} />

          {/* Media Grid */}
          <View style={styles.gridContainer}>
            <RecentGallery
              selectedAssets={selectedAssets}
              onToggleSelectAsset={toggleSelectAsset}
            />
          </View>

          {/* WhatsApp Bottom Bar when media selected */}
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
                  placeholderTextColor="#8696a0"
                  value={caption}
                  onChangeText={setCaption}
                />
              </View>

              {/* Right Green Send Button with Badge */}
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
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#202c33",
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  gridContainer: {
    flex: 1,
    backgroundColor: "#111b21",
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2c34",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a3942",
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
    backgroundColor: "#111b21",
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
    backgroundColor: "#2a3942",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
  },
  captionInput: {
    color: "#e9edef",
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
    borderColor: "#1f2c34",
  },
  sendBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});