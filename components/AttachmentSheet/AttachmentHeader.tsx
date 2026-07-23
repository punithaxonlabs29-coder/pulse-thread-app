import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../ui/AppText";

interface Props {
  onSelectOption: (option: any) => void;
  isDealChat?: boolean;
}

const BASE_OPTIONS = [
  { id: "gallery", label: "Gallery", icon: "images", bg: "#FFF7ED", color: "#F97316" },
  { id: "document", label: "Document", icon: "document-text", bg: "#F3E8FF", color: "#8B5CF6" },
  { id: "audio", label: "Audio", icon: "musical-notes", bg: "#FEF3C7", color: "#F59E0B" },
];

const DEAL_OPTIONS = [
  { id: "deal_inputs", label: "Deal inputs", icon: "clipboard-outline", bg: "#EFF6FF", color: "#2563EB" },
  { id: "explain_clip", label: "Explain with a clip", icon: "videocam-outline", bg: "#FDF2F8", color: "#DB2777" },
];

export default function AttachmentHeader({ onSelectOption, isDealChat = false }: Props) {
  const options = isDealChat ? [...BASE_OPTIONS, ...DEAL_OPTIONS] : BASE_OPTIONS;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {options.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.itemContainer}
            activeOpacity={0.7}
            onPress={() => onSelectOption(item.id)}
          >
            <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={22} color={item.color} />
            </View>
            <AppText style={styles.label} numberOfLines={2}>{item.label}</AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  itemContainer: {
    width: "25%",
    alignItems: "center",
    marginVertical: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    marginTop: 6,
    fontSize: 11.5,
    color: "#475569",
    fontWeight: "500",
    textAlign: "center",
    paddingHorizontal: 2,
  },
});
