import React, { useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import EditorToolbar, { EditorTool } from "./EditorToolbar";
import CropTool from "./CropTool";
import RotateTool from "./RotateTool";
import DrawTool from "./DrawTool";
import TextTool from "./TextTool";
import EmojiTool from "./EmojiTool";
import BlurTool from "./BlurTool";
import ImageOverlayCanvas from "./ImageOverlayCanvas";
import { EditableImage } from "./types";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  image: EditableImage | null;
  onClose: () => void;
  onDone: (editedImage: EditableImage) => void;
}

export default function ImageEditorScreen({
  visible,
  image,
  onClose,
  onDone,
}: Props) {
  const [activeTool, setActiveTool] = useState<EditorTool | null>(null);
  const [currentImage, setCurrentImage] = useState<EditableImage | null>(image);

  // Sync state when new image passed in or modal becomes visible
  React.useEffect(() => {
    if (visible && image) {
      setCurrentImage(image);
      setActiveTool(null);
    }
  }, [visible, image]);

  if (!visible || !currentImage) return null;

  const handleFinish = () => {
    onDone(currentImage);
  };

  const toolTitle = activeTool
    ? activeTool.charAt(0).toUpperCase() + activeTool.slice(1)
    : "Edit";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={() => {
        if (activeTool) setActiveTool(null);
        else onClose();
      }}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="#000" barStyle="light-content" />
      <View style={styles.root}>

        {/* ── Top Bar ── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => {
              if (activeTool) setActiveTool(null);
              else onClose();
            }}
            style={styles.topBtn}
          >
            <Ionicons name={activeTool ? "arrow-back" : "close"} size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.topTitle}>{toolTitle}</Text>

          <TouchableOpacity onPress={handleFinish} style={styles.doneBtn}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* ── Content Area ── */}
        <View style={styles.content}>
          {activeTool === "crop" && (
            <CropTool
              imageUri={currentImage.editedUri}
              onDone={(newUri) => {
                setCurrentImage((prev) => prev ? { ...prev, editedUri: newUri } : null);
                setActiveTool(null);
              }}
              onCancel={() => setActiveTool(null)}
            />
          )}

          {activeTool === "rotate" && (
            <RotateTool
              imageUri={currentImage.editedUri}
              onDone={(newUri) => {
                setCurrentImage((prev) => prev ? { ...prev, editedUri: newUri } : null);
                setActiveTool(null);
              }}
            />
          )}

          {activeTool === "draw" && (
            <DrawTool
              imageUri={currentImage.editedUri}
              drawings={currentImage.drawings}
              onChangeDrawings={(drawings) => {
                setCurrentImage((prev) => prev ? { ...prev, drawings } : null);
              }}
              onDone={() => setActiveTool(null)}
            />
          )}

          {activeTool === "text" && (
            <TextTool
              imageUri={currentImage.editedUri}
              texts={currentImage.texts}
              onChangeTexts={(texts) => {
                setCurrentImage((prev) => prev ? { ...prev, texts } : null);
              }}
              onDone={() => setActiveTool(null)}
            />
          )}

          {activeTool === "emoji" && (
            <EmojiTool
              imageUri={currentImage.editedUri}
              emojis={currentImage.emojis}
              onChangeEmojis={(emojis) => {
                setCurrentImage((prev) => prev ? { ...prev, emojis } : null);
              }}
              onDone={() => setActiveTool(null)}
            />
          )}

          {activeTool === "blur" && (
            <BlurTool
              imageUri={currentImage.editedUri}
              blurs={currentImage.blurs || []}
              onChangeBlurs={(blurs) => {
                setCurrentImage((prev) => prev ? { ...prev, blurs } : null);
              }}
              onDone={() => setActiveTool(null)}
            />
          )}

          {/* Default — Image preview with persistent drawing/text/emoji/blur overlay */}
          {!activeTool && (
            <View style={styles.previewArea}>
              <View style={styles.canvasContainer}>
                <Image
                  source={{ uri: currentImage.editedUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                <ImageOverlayCanvas
                  width={SCREEN_W - 40}
                  height={SCREEN_H * 0.55}
                  drawings={currentImage.drawings}
                  texts={currentImage.texts}
                  emojis={currentImage.emojis}
                  blurs={currentImage.blurs || []}
                />
              </View>
              <Text style={styles.hint}>Select a tool below to edit</Text>
            </View>
          )}
        </View>

        {/* ── Bottom Toolbar ── */}
        {!activeTool && (
          <EditorToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: "#000",
  },
  topBtn: { padding: 6, width: 44 },
  topTitle: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F97316",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 5,
  },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  content: { flex: 1 },
  previewArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  canvasContainer: {
    width: SCREEN_W - 40,
    height: SCREEN_H * 0.55,
    position: "relative",
    overflow: "hidden",
    borderRadius: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  hint: { color: "#555", fontSize: 13, textAlign: "center" },
});
