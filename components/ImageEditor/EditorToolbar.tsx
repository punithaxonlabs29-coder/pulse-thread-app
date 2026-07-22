import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export type EditorTool =
  | "crop"
  | "rotate"
  | "draw"
  | "text"
  | "emoji"
  | "blur";

interface Props {
  activeTool: EditorTool | null;
  onSelectTool: (tool: EditorTool) => void;
}

const TOOLS: {
  id: EditorTool;
  label: string;
  icon: string;
  iconSet: "ionicons" | "material";
}[] = [
  { id: "crop",   label: "Crop",   icon: "crop",               iconSet: "ionicons"  },
  { id: "rotate", label: "Rotate", icon: "refresh-outline",    iconSet: "ionicons"  },
  { id: "draw",   label: "Draw",   icon: "pencil",             iconSet: "ionicons"  },
  { id: "text",   label: "Text",   icon: "text-outline",       iconSet: "ionicons"  },
  { id: "emoji",  label: "Emoji",  icon: "happy-outline",      iconSet: "ionicons"  },
  { id: "blur",   label: "Blur",   icon: "water-outline",      iconSet: "ionicons"  },
];

export default function EditorToolbar({ activeTool, onSelectTool }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {TOOLS.map((tool) => {
          const isActive = activeTool === tool.id;
          return (
            <TouchableOpacity
              key={tool.id}
              style={[styles.toolBtn, isActive && styles.toolBtnActive]}
              onPress={() => onSelectTool(tool.id)}
            >
              <Ionicons
                name={tool.icon as any}
                size={22}
                color={isActive ? "#F97316" : "#fff"}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tool.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingVertical: 10,
  },
  row: {
    paddingHorizontal: 16,
    gap: 8,
  },
  toolBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    minWidth: 68,
    gap: 4,
  },
  toolBtnActive: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderWidth: 1,
    borderColor: "#F97316",
  },
  label: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "500",
  },
  labelActive: {
    color: "#F97316",
  },
});
