import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stroke, TextOverlay, EmojiOverlay, BlurPatch } from "./types";

interface Props {
  width: number;
  height: number;
  drawings?: Stroke[];
  texts?: TextOverlay[];
  emojis?: EmojiOverlay[];
  blurs?: BlurPatch[];
}

function StrokeLine({ stroke }: { stroke: Stroke }) {
  const segments: React.ReactNode[] = [];

  for (let i = 1; i < stroke.points.length; i++) {
    const p1 = stroke.points[i - 1];
    const p2 = stroke.points[i];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.5) continue;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;

    segments.push(
      <View
        key={`${stroke.id}-${i}`}
        style={{
          position: "absolute",
          left: cx - length / 2,
          top: cy - stroke.width / 2,
          width: length,
          height: stroke.width,
          backgroundColor: stroke.color,
          opacity: stroke.opacity,
          borderRadius: stroke.width / 2,
          transform: [{ rotate: `${angle}deg` }],
        }}
      />
    );
  }

  return <>{segments}</>;
}

function BlurLine({ blur }: { blur: BlurPatch }) {
  const segments: React.ReactNode[] = [];

  for (let i = 1; i < blur.points.length; i++) {
    const p1 = blur.points[i - 1];
    const p2 = blur.points[i];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 0.5) continue;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;

    // Render dense mosaic pixelated privacy blur block
    segments.push(
      <View
        key={`${blur.id}-${i}`}
        style={{
          position: "absolute",
          left: cx - length / 2,
          top: cy - blur.width / 2,
          width: length,
          height: blur.width,
          backgroundColor: "#888888",
          opacity: 0.95,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: "#666666",
          transform: [{ rotate: `${angle}deg` }],
        }}
      />
    );
  }

  return <>{segments}</>;
}

export default function ImageOverlayCanvas({
  width,
  height,
  drawings = [],
  texts = [],
  emojis = [],
  blurs = [],
}: Props) {
  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* Blur privacy layer */}
      {blurs.map((blur) => (
        <BlurLine key={blur.id} blur={blur} />
      ))}

      {/* Drawings layer */}
      {drawings.map((stroke) => (
        <StrokeLine key={stroke.id} stroke={stroke} />
      ))}

      {/* Text layer */}
      {texts.map((t) => (
        <View key={t.id} style={[styles.overlayItem, { left: t.x, top: t.y }]}>
          <Text
            style={{
              color: t.color,
              fontSize: t.fontSize,
              fontWeight: t.bold ? "700" : "400",
              fontStyle: t.italic ? "italic" : "normal",
              textShadowColor: "rgba(0,0,0,0.8)",
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {t.text}
          </Text>
        </View>
      ))}

      {/* Emoji layer */}
      {emojis.map((e) => (
        <View key={e.id} style={[styles.overlayItem, { left: e.x, top: e.y }]}>
          <Text style={{ fontSize: e.size }}>{e.emoji}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  overlayItem: {
    position: "absolute",
  },
});
