import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextOverlay } from "./types";
import ImageOverlayCanvas from "./ImageOverlayCanvas";

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_H = Dimensions.get("window").height * 0.52;

interface Props {
  imageUri: string;
  texts: TextOverlay[];
  onChangeTexts: (texts: TextOverlay[]) => void;
  onDone: () => void;
}

const COLORS = ["#FFFFFF", "#000000", "#FF3B30", "#F97316", "#FFCC00", "#34C759", "#007AFF"];
const FONT_SIZES = [16, 20, 26, 34, 44];

export default function TextTool({
  imageUri,
  texts,
  onChangeTexts,
  onDone,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [selectedColor, setSelectedColor] = useState("#FFFFFF");
  const [fontSize, setFontSize] = useState(26);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [addingNew, setAddingNew] = useState(false);

  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const startAddText = () => {
    setInputText("");
    setEditingId(null);
    setAddingNew(true);
  };

  const confirmText = () => {
    if (!inputText.trim()) {
      setAddingNew(false);
      setEditingId(null);
      return;
    }

    if (editingId) {
      onChangeTexts(
        texts.map((o) =>
          o.id === editingId
            ? { ...o, text: inputText, color: selectedColor, fontSize, bold, italic }
            : o
        )
      );
      setEditingId(null);
    } else {
      const newOverlay: TextOverlay = {
        id: Date.now().toString(),
        text: inputText,
        x: SCREEN_W / 2 - 60,
        y: CANVAS_H / 2 - 20,
        color: selectedColor,
        fontSize,
        bold,
        italic,
      };
      onChangeTexts([...texts, newOverlay]);
    }

    setAddingNew(false);
    setInputText("");
    Keyboard.dismiss();
  };

  const editOverlay = (o: TextOverlay) => {
    setEditingId(o.id);
    setInputText(o.text);
    setSelectedColor(o.color);
    setFontSize(o.fontSize);
    setBold(o.bold);
    setItalic(o.italic);
    setAddingNew(true);
  };

  const removeOverlay = (id: string) => {
    onChangeTexts(texts.filter((o) => o.id !== id));
  };

  const makeDragHandler = (id: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        const overlay = texts.find((o) => o.id === id);
        if (overlay) {
          dragRef.current = { id, startX: gs.x0, startY: gs.y0, origX: overlay.x, origY: overlay.y };
        }
      },
      onPanResponderMove: (_, gs) => {
        if (!dragRef.current || dragRef.current.id !== id) return;
        const dx = gs.moveX - dragRef.current.startX;
        const dy = gs.moveY - dragRef.current.startY;
        onChangeTexts(
          texts.map((o) =>
            o.id === id ? { ...o, x: dragRef.current!.origX + dx, y: dragRef.current!.origY + dy } : o
          )
        );
      },
      onPanResponderRelease: () => {
        dragRef.current = null;
      },
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      {/* Canvas */}
      <View style={styles.canvas}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {texts.map((o) => {
          const drag = makeDragHandler(o.id);
          return (
            <View
              key={o.id}
              style={[styles.textOverlay, { left: o.x, top: o.y }]}
              {...drag.panHandlers}
            >
              <TouchableOpacity onLongPress={() => removeOverlay(o.id)} onPress={() => editOverlay(o)}>
                <Text
                  style={{
                    color: o.color,
                    fontSize: o.fontSize,
                    fontWeight: o.bold ? "700" : "400",
                    fontStyle: o.italic ? "italic" : "normal",
                    textShadowColor: "rgba(0,0,0,0.8)",
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {o.text}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Input panel when active */}
      {addingNew ? (
        <View style={styles.inputPanel}>
          <View style={styles.styleRow}>
            <TouchableOpacity
              style={[styles.styleBtn, bold && styles.styleBtnActive]}
              onPress={() => setBold(!bold)}
            >
              <Text style={[styles.styleBtnText, { fontWeight: "700" }]}>B</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.styleBtn, italic && styles.styleBtnActive]}
              onPress={() => setItalic(!italic)}
            >
              <Text style={[styles.styleBtnText, { fontStyle: "italic" }]}>I</Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingHorizontal: 8 }}>
              {FONT_SIZES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setFontSize(s)}
                  style={[styles.sizeBtn, fontSize === s && styles.sizeBtnActive]}
                >
                  <Text style={[styles.sizeBtnText, fontSize === s && { color: "#F97316" }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow} contentContainerStyle={styles.colorContent}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotActive]}
              />
            ))}
          </ScrollView>

          <View style={styles.textInputRow}>
            <TextInput
              style={[styles.textInput, { color: selectedColor, fontWeight: bold ? "700" : "400", fontStyle: italic ? "italic" : "normal", fontSize }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type text..."
              placeholderTextColor="#555"
              autoFocus
              multiline
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmText}>
              <Ionicons name="checkmark" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.addTextBtn} onPress={startAddText}>
            <Ionicons name="text" size={20} color="#fff" />
            <Text style={styles.addTextBtnText}>Tap to Add Text</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.doneBtnText}>Apply Text</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  canvas: { width: SCREEN_W, height: CANVAS_H, backgroundColor: "#000" },
  image: { width: SCREEN_W, height: CANVAS_H },
  textOverlay: { position: "absolute" },

  inputPanel: { backgroundColor: "#1a1a1a", paddingBottom: 8 },

  styleRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  styleBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#2a2a2a", justifyContent: "center", alignItems: "center" },
  styleBtnActive: { backgroundColor: "rgba(249,115,22,0.2)", borderWidth: 1, borderColor: "#F97316" },
  styleBtnText: { color: "#fff", fontSize: 16 },
  sizeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#2a2a2a" },
  sizeBtnActive: { backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "#F97316" },
  sizeBtnText: { color: "#aaa", fontSize: 13 },

  colorRow: { maxHeight: 50 },
  colorContent: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, alignItems: "center" },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: "transparent" },
  colorDotActive: { borderColor: "#fff", transform: [{ scale: 1.2 }] },

  textInputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  textInput: { flex: 1, backgroundColor: "#2a2a2a", borderRadius: 10, padding: 10, maxHeight: 80 },
  confirmBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F97316", justifyContent: "center", alignItems: "center" },

  bottomBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, backgroundColor: "#1a1a1a", borderTopWidth: 1, borderTopColor: "#2a2a2a" },
  addTextBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  addTextBtnText: { color: "#fff", fontSize: 15 },
  doneBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#F97316", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  doneBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
