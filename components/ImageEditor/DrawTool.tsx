import React, { useRef, useState } from "react";
import {
  View,
  PanResponder,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stroke, Point } from "./types";
import ImageOverlayCanvas from "./ImageOverlayCanvas";

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_H = Dimensions.get("window").height * 0.55;

interface Props {
  imageUri: string;
  drawings: Stroke[];
  onChangeDrawings: (drawings: Stroke[]) => void;
  onDone: () => void;
}

const COLORS = [
  "#FF3B30", "#F97316", "#FFCC00",
  "#34C759", "#007AFF", "#AF52DE",
  "#FFFFFF", "#000000",
];

const BRUSHES = [
  { label: "Pen",         width: 3,  opacity: 1    },
  { label: "Marker",      width: 9,  opacity: 1    },
  { label: "Highlighter", width: 20, opacity: 0.4  },
];

export default function DrawTool({
  imageUri,
  drawings,
  onChangeDrawings,
  onDone,
}: Props) {
  const [selectedColor, setSelectedColor] = useState("#FF3B30");
  const [selectedBrush, setSelectedBrush] = useState(0);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);

  const drawingsRef = useRef(drawings);
  drawingsRef.current = drawings;

  const selectedColorRef = useRef(selectedColor);
  selectedColorRef.current = selectedColor;

  const selectedBrushRef = useRef(selectedBrush);
  selectedBrushRef.current = selectedBrush;

  const currentPointsRef = useRef<Point[]>([]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentPointsRef.current = [pt];
        setCurrentStroke({
          id: Date.now().toString(),
          points: [pt],
          color: selectedColorRef.current,
          width: BRUSHES[selectedBrushRef.current].width,
          opacity: BRUSHES[selectedBrushRef.current].opacity,
        });
      },

      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const pt = { x: locationX, y: locationY };
        currentPointsRef.current = [...currentPointsRef.current, pt];
        setCurrentStroke({
          id: Date.now().toString(),
          points: [...currentPointsRef.current],
          color: selectedColorRef.current,
          width: BRUSHES[selectedBrushRef.current].width,
          opacity: BRUSHES[selectedBrushRef.current].opacity,
        });
      },

      onPanResponderRelease: () => {
        if (currentPointsRef.current.length > 0) {
          const finished: Stroke = {
            id: Date.now().toString(),
            points: [...currentPointsRef.current],
            color: selectedColorRef.current,
            width: BRUSHES[selectedBrushRef.current].width,
            opacity: BRUSHES[selectedBrushRef.current].opacity,
          };
          onChangeDrawings([...drawingsRef.current, finished]);
          setCurrentStroke(null);
          currentPointsRef.current = [];
        }
      },
    })
  ).current;

  const handleUndo = () => {
    if (drawings.length === 0) return;
    onChangeDrawings(drawings.slice(0, -1));
  };

  const handleClear = () => {
    if (drawings.length === 0) return;
    Alert.alert("Clear drawing?", "This will remove all strokes.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: () => onChangeDrawings([]),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Undo / Clear controls */}
      <View style={styles.topActions}>
        <TouchableOpacity
          onPress={handleUndo}
          style={[styles.quickBtn, drawings.length === 0 && styles.quickBtnDisabled]}
          disabled={drawings.length === 0}
        >
          <Ionicons name="arrow-undo" size={20} color={drawings.length === 0 ? "#444" : "#fff"} />
          <Text style={[styles.quickBtnLabel, drawings.length === 0 && { color: "#444" }]}>
            Undo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleClear}
          style={[styles.quickBtn, drawings.length === 0 && styles.quickBtnDisabled]}
          disabled={drawings.length === 0}
        >
          <Ionicons name="trash-outline" size={20} color={drawings.length === 0 ? "#444" : "#FF3B30"} />
          <Text style={[styles.quickBtnLabel, { color: drawings.length === 0 ? "#444" : "#FF3B30" }]}>
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Drawing Canvas */}
      <View style={styles.canvas} {...panResponder.panHandlers} pointerEvents="box-only">
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {/* Existing persistent drawings */}
        <ImageOverlayCanvas width={SCREEN_W} height={CANVAS_H} drawings={drawings} />

        {/* Live active stroke */}
        {currentStroke && (
          <ImageOverlayCanvas width={SCREEN_W} height={CANVAS_H} drawings={[currentStroke]} />
        )}
      </View>

      {/* Brush selector */}
      <View style={styles.brushRow}>
        {BRUSHES.map((b, i) => (
          <TouchableOpacity
            key={b.label}
            style={[styles.brushBtn, selectedBrush === i && styles.brushBtnActive]}
            onPress={() => setSelectedBrush(i)}
          >
            <View
              style={[
                styles.brushPreview,
                {
                  width: Math.min(b.width, 18),
                  height: Math.min(b.width, 18),
                  backgroundColor: selectedColor,
                  opacity: b.opacity,
                  borderRadius: b.width,
                },
              ]}
            />
            <Text style={[styles.brushLabel, selectedBrush === i && styles.brushLabelActive]}>
              {b.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Color Palette */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.colorRow}
        contentContainerStyle={styles.colorContent}
      >
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setSelectedColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              c === "#FFFFFF" && styles.colorDotWhite,
              selectedColor === c && styles.colorDotActive,
            ]}
          />
        ))}
      </ScrollView>

      {/* Apply / Done */}
      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.doneBtnText}>Apply Drawing</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },

  topActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
  },
  quickBtnDisabled: { opacity: 0.4 },
  quickBtnLabel: { color: "#fff", fontSize: 13 },

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

  brushRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  brushBtn: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  brushBtnActive: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderWidth: 1,
    borderColor: "#F97316",
  },
  brushPreview: { borderRadius: 20 },
  brushLabel: { color: "#aaa", fontSize: 11 },
  brushLabelActive: { color: "#F97316" },

  colorRow: { backgroundColor: "#1a1a1a", maxHeight: 56 },
  colorContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    alignItems: "center",
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotWhite: { borderColor: "#444" },
  colorDotActive: {
    borderColor: "#fff",
    transform: [{ scale: 1.25 }],
  },

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
