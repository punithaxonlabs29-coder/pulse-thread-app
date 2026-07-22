import React, { useRef, useState } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurPatch, Point } from "./types";
import ImageOverlayCanvas from "./ImageOverlayCanvas";

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_H = Dimensions.get("window").height * 0.55;

interface Props {
  imageUri: string;
  blurs: BlurPatch[];
  onChangeBlurs: (blurs: BlurPatch[]) => void;
  onDone: () => void;
}

const BRUSH_SIZES = [
  { label: "Fine", width: 14 },
  { label: "Medium", width: 24 },
  { label: "Thick", width: 38 },
];

export default function BlurTool({
  imageUri,
  blurs,
  onChangeBlurs,
  onDone,
}: Props) {
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(1);
  const [currentBlur, setCurrentBlur] = useState<BlurPatch | null>(null);

  const currentPointsRef = useRef<Point[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentPointsRef.current = [pt];
        setCurrentBlur({
          id: Date.now().toString(),
          points: [pt],
          width: BRUSH_SIZES[selectedSizeIndex].width,
        });
      },

      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentPointsRef.current = [...currentPointsRef.current, pt];
        setCurrentBlur((prev) =>
          prev ? { ...prev, points: [...currentPointsRef.current] } : null
        );
      },

      onPanResponderRelease: () => {
        if (currentPointsRef.current.length > 0) {
          const finished: BlurPatch = {
            id: Date.now().toString(),
            points: [...currentPointsRef.current],
            width: BRUSH_SIZES[selectedSizeIndex].width,
          };
          onChangeBlurs([...blurs, finished]);
          setCurrentBlur(null);
          currentPointsRef.current = [];
        }
      },
    })
  ).current;

  const handleUndo = () => {
    if (blurs.length === 0) return;
    onChangeBlurs(blurs.slice(0, -1));
  };

  const handleClear = () => {
    if (blurs.length === 0) return;
    Alert.alert("Clear blur patches?", "This will remove all privacy blurs.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => onChangeBlurs([]),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Undo / Clear controls */}
      <View style={styles.topActions}>
        <Text style={styles.hintText}>
          Brush over phone numbers, faces or QR codes
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={handleUndo}
            style={[styles.quickBtn, blurs.length === 0 && styles.quickBtnDisabled]}
            disabled={blurs.length === 0}
          >
            <Ionicons name="arrow-undo" size={18} color={blurs.length === 0 ? "#444" : "#fff"} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClear}
            style={[styles.quickBtn, blurs.length === 0 && styles.quickBtnDisabled]}
            disabled={blurs.length === 0}
          >
            <Ionicons name="trash-outline" size={18} color={blurs.length === 0 ? "#444" : "#FF3B30"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Blur Touch Canvas */}
      <View style={styles.canvas} {...panResponder.panHandlers} pointerEvents="box-only">
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {/* Existing persistent blurs */}
        <ImageOverlayCanvas width={SCREEN_W} height={CANVAS_H} blurs={blurs} />

        {/* Active blur path */}
        {currentBlur && (
          <ImageOverlayCanvas width={SCREEN_W} height={CANVAS_H} blurs={[currentBlur]} />
        )}
      </View>

      {/* Brush Size Selector */}
      <View style={styles.sizeRow}>
        {BRUSH_SIZES.map((b, i) => (
          <TouchableOpacity
            key={b.label}
            style={[styles.sizeBtn, selectedSizeIndex === i && styles.sizeBtnActive]}
            onPress={() => setSelectedSizeIndex(i)}
          >
            <View
              style={[
                styles.sizeDot,
                { width: b.width / 1.5, height: b.width / 1.5, borderRadius: b.width / 3 },
              ]}
            />
            <Text style={[styles.sizeLabel, selectedSizeIndex === i && styles.sizeLabelActive]}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Apply / Done */}
      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.doneBtnText}>Apply Privacy Blur</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },

  topActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hintText: {
    color: "#aaa",
    fontSize: 12,
  },
  quickBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  quickBtnDisabled: { opacity: 0.4 },

  canvas: {
    width: SCREEN_W,
    height: CANVAS_H,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  image: {
    width: SCREEN_W,
    height: CANVAS_H,
  },

  sizeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  sizeBtn: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  sizeBtnActive: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderWidth: 1,
    borderColor: "#F97316",
  },
  sizeDot: {
    backgroundColor: "#888888",
  },
  sizeLabel: { color: "#aaa", fontSize: 12, fontWeight: "500" },
  sizeLabelActive: { color: "#F97316" },

  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 14,
    paddingVertical: 13,
    gap: 8,
  },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
