import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { styles } from './ChatHeader.styles';


interface ChatHeaderProps {
  name: string;
  status: string;
  imageUrl?: string;
  typingUsers?: string[];
}

export default function ChatHeader({ name, status, imageUrl, typingUsers = [] }: ChatHeaderProps) {
  const router = useRouter();

  const initials = (name || "U")
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#F97316" />
      </TouchableOpacity>

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.profileImage} />
      ) : (
        <View style={[styles.profileImage, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.headerInfo}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {typingUsers.length > 0 ? (
          <Text style={styles.typingStatus} numberOfLines={1}>
            {typingUsers.length === 1 
              ? `${typingUsers[0]} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </Text>
        ) : (
          <Text style={styles.status} numberOfLines={1}>{status}</Text>
        )}
      </View>

      <TouchableOpacity style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={24} color="#111827" />
      </TouchableOpacity>
    </View>
  );
}

