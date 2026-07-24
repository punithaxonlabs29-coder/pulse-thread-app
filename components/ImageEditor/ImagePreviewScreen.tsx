import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { captureRef } from "react-native-view-shot";
import { PendingAttachment } from "../AttachmentPreview";
import ImageEditorScreen from "./ImageEditorScreen";
import ImageOverlayCanvas from "./ImageOverlayCanvas";
import { EditableImage } from "./types";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
  visible: boolean;
  images: PendingAttachment[];
  onClose: () => void;
  onSend: (images: PendingAttachment[], caption: string) => void;
}

export default function ImagePreviewScreen({
  visible,
  images,
  onClose,
  onSend,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editableImages, setEditableImages] = useState<EditableImage[]>([]);
  const [exporting, setExporting] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const prevVisibleRef = useRef(false);
  const canvasRefs = useRef<{ [key: string]: View | null }>({});

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      const converted: EditableImage[] = images.map((img, idx) => ({
        id: `${Date.now()}-${idx}`,
        originalUri: img.uri,
        editedUri: img.uri,
        drawings: [],
        texts: [],
        emojis: [],
        rotation: 0,
        name: img.name,
        type: img.type,
      }));
      setEditableImages(converted);
      setCurrentIndex(0);
      setCaption("");
      setExporting(false);
    }
    prevVisibleRef.current = visible;
  }, [visible, images]);

  if (!visible || editableImages.length === 0) return null;

  const current = editableImages[currentIndex] || editableImages[0];

  const handleRemoveImage = (indexToRemove: number) => {
    if (editableImages.length === 1) {
      onClose();
      return;
    }

    const updated = editableImages.filter((_, i) => i !== indexToRemove);
    setEditableImages(updated);

    if (currentIndex >= updated.length) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const handleSend = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const finalAttachments: PendingAttachment[] = [];

      for (const img of editableImages) {
        const hasOverlays =
          img.drawings.length > 0 ||
          img.texts.length > 0 ||
          img.emojis.length > 0;

        const refNode = canvasRefs.current[img.id];

        if (hasOverlays && refNode) {
          try {
            const exportedUri = await captureRef(refNode, {
              format: "jpg",
              quality: 0.95,
              result: "tmpfile",
            });

            finalAttachments.push({
              uri: exportedUri,
              type: "image/jpeg",
              name: `edited_${img.name || Date.now() + ".jpg"}`,
            });
          } catch (err) {
            console.log("Export capture error, falling back to base image:", err);
            finalAttachments.push({
              uri: img.editedUri,
              type: img.type,
              name: img.name,
            });
          }
        } else {
          finalAttachments.push({
            uri: img.editedUri,
            type: img.type,
            name: img.name,
          });
        }
      }

      onSend(finalAttachments, caption);
      setCaption("");
      setCurrentIndex(0);
    } catch (e) {
      console.log("Send process failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.topBtn} disabled={exporting}>
            <Ionicons name="close" size={26} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.topRight}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditingIndex(currentIndex)}
              disabled={exporting}
            >
              <Ionicons name="sparkles" size={16} color="#F97316" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveImage(currentIndex)}
              disabled={exporting}
            >
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Image Canvas Preview */}
        <View style={styles.imageArea}>
          <FlatList
            ref={flatRef}
            data={editableImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
              if (idx >= 0 && idx < editableImages.length) {
                setCurrentIndex(idx);
              }
            }}
            renderItem={({ item }) => (
              <View style={styles.imagePage}>
                <View
                  ref={(node) => {
                    canvasRefs.current[item.id] = node;
                  }}
                  collapsable={false}
                  style={styles.previewCanvasContainer}
                >
                  <Image
                    source={{ uri: item.editedUri }}
                    style={styles.mainImage}
                    resizeMode="contain"
                  />
                  <ImageOverlayCanvas
                    width={SCREEN_W}
                    height={SCREEN_H * 0.55}
                    drawings={item.drawings}
                    texts={item.texts}
                    emojis={item.emojis}
                  />
                </View>
              </View>
            )}
          />

          {/* Dot indicators */}
          {editableImages.length > 1 && (
            <View style={styles.dotRow}>
              {editableImages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === currentIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Thumbnail Strip */}
        {editableImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailStrip}
            contentContainerStyle={styles.thumbnailContent}
          >
            {editableImages.map((img, i) => (
              <View key={img.id} style={styles.thumbnailWrapper}>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentIndex(i);
                    flatRef.current?.scrollToIndex({ index: i, animated: true });
                  }}
                  disabled={exporting}
                >
                  <Image
                    source={{ uri: img.editedUri }}
                    style={[
                      styles.thumbnail,
                      i === currentIndex && styles.thumbnailActive,
                    ]}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.thumbnailDeleteBtn}
                  onPress={() => handleRemoveImage(i)}
                  disabled={exporting}
                >
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Caption Input */}
        <View style={styles.captionRow}>
          <Ionicons name="happy-outline" size={22} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption..."
            placeholderTextColor="#94A3B8"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={300}
            editable={!exporting}
          />
        </View>

        {/* Send Button */}
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.sendText}>
                Send{editableImages.length > 1 ? ` (${editableImages.length})` : ""}
              </Text>
              <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* Image Editor Modal */}
      {editingIndex !== null && editableImages[editingIndex] && (
        <ImageEditorScreen
          visible={editingIndex !== null}
          image={editableImages[editingIndex]}
          onClose={() => setEditingIndex(null)}
          onDone={(updatedImage) => {
            setEditableImages((prev) =>
              prev.map((img, i) => (i === editingIndex ? updatedImage : img))
            );
            setEditingIndex(null);
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  topBtn: {
    padding: 6,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 5,
  },
  editBtnText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  removeBtn: {
    padding: 6,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 20,
  },

  imageArea: {
    flex: 1,
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  imagePage: {
    width: SCREEN_W,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewCanvasContainer: {
    width: SCREEN_W,
    height: SCREEN_H * 0.55,
    position: "relative",
    backgroundColor: "#FFFFFF",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },

  dotRow: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  dotActive: {
    backgroundColor: "#F97316",
    width: 18,
  },

  thumbnailStrip: {
    maxHeight: 74,
    backgroundColor: "#F8FAFC",
  },
  thumbnailContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  thumbnailWrapper: {
    position: "relative",
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 6,
    opacity: 0.7,
  },
  thumbnailActive: {
    opacity: 1,
    borderWidth: 2,
    borderColor: "#F97316",
  },
  thumbnailDeleteBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },

  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  captionInput: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    maxHeight: 80,
  },

  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    paddingVertical: 15,
  },
  sendText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
