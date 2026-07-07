import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ChatHeaderProps {
  name: string;
  status: string;
}

export default function ChatHeader({ name, status }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#111" />
      </TouchableOpacity>

      <View style={styles.headerInfo}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButton: {
    paddingRight: 12,
  },
  headerInfo: {
    marginLeft: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  status: {
    color: "#22C55E",
    marginTop: 2,
    fontSize: 13,
  },
});
