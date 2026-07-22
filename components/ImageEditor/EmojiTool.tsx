import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmojiOverlay } from "./types";
import ImageOverlayCanvas from "./ImageOverlayCanvas";

const SCREEN_W = Dimensions.get("window").width;
const CANVAS_H = Dimensions.get("window").height * 0.52;

interface Props {
  imageUri: string;
  emojis: EmojiOverlay[];
  onChangeEmojis: (emojis: EmojiOverlay[]) => void;
  onDone: () => void;
}

const EMOJI_LIST = [
  "😀","😂","😍","🥰","😎","🤩","😜","🤔","😮","😢","😡","🥳",
  "👍","👎","👏","🙌","🤝","👋","✌️","🤞","💪","🙏","❤️","🔥",
  "⭐","✨","💯","🎉","🎊","🎁","💰","💎","🏆","🚀","💡","📸",
  "🌈","🌟","💫","⚡","🌙","☀️","🌊","🌸","🌺","🍕","☕","🎵",
];

export default function EmojiTool({
  imageUri,
  emojis,
  onChangeEmojis,
  onDone,
}: Props) {
  const dragRef = React.useRef<{ id: string; sx: number; sy: number; ox: number; oy: number } | null>(null);

  const addEmoji = (emoji: string) => {
    const newEmoji: EmojiOverlay = {
      id: Date.now().toString(),
      emoji,
      x: SCREEN_W / 2 - 22,
      y: CANVAS_H / 2 - 22,
      size: 44,
    };
    onChangeEmojis([...emojis, newEmoji]);
  };

  const removeEmoji = (id: string) => {
    onChangeEmojis(emojis.filter((o) => o.id !== id));
  };

  const makeDrag = (id: string) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gs) => {
        const o = emojis.find((e) => e.id === id);
        if (o) dragRef.current = { id, sx: gs.x0, sy: gs.y0, ox: o.x, oy: o.y };
      },
      onPanResponderMove: (_, gs) => {
        if (!dragRef.current || dragRef.current.id !== id) return;
        const dx = gs.moveX - dragRef.current.sx;
        const dy = gs.moveY - dragRef.current.sy;
        onChangeEmojis(
          emojis.map((o) =>
            o.id === id ? { ...o, x: dragRef.current!.ox + dx, y: dragRef.current!.oy + dy } : o
          )
        );
      },
      onPanResponderRelease: () => {
        dragRef.current = null;
      },
    });

  return (
    <View style={styles.container}>
      {/* Canvas */}
      <View style={styles.canvas}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />

        {emojis.map((o) => {
          const drag = makeDrag(o.id);
          return (
            <View
              key={o.id}
              style={[styles.emojiOverlay, { left: o.x, top: o.y }]}
              {...drag.panHandlers}
            >
              <TouchableOpacity onLongPress={() => removeEmoji(o.id)}>
                <Text style={{ fontSize: o.size }}>{o.emoji}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>

      {/* Emoji picker grid */}
      <View style={styles.pickerPanel}>
        <Text style={styles.hint}>Tap to add • Drag to move • Long press to remove</Text>
        <FlatList
          data={EMOJI_LIST}
          numColumns={8}
          keyExtractor={(item) => item}
          style={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.emojiCell} onPress={() => addEmoji(item)}>
              <Text style={styles.emojiItem}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Done button */}
      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Ionicons name="checkmark" size={18} color="#fff" />
        <Text style={styles.doneBtnText}>Apply Emojis</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },

  canvas: { width: SCREEN_W, height: CANVAS_H, backgroundColor: "#000" },
  image: { width: SCREEN_W, height: CANVAS_H },
  emojiOverlay: { position: "absolute" },

  pickerPanel: { flex: 1, backgroundColor: "#1a1a1a", paddingTop: 6 },
  hint: { color: "#555", fontSize: 11, textAlign: "center", marginBottom: 4 },
  grid: { flex: 1 },
  emojiCell: { flex: 1, justifyContent: "center", alignItems: "center", padding: 4 },
  emojiItem: { fontSize: 26 },

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
