import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "../ui/AppText";

interface Props {
  onSelectOption: (
    option: "camera" | "gallery" | "document" | "video"
  ) => void;
}

export default function AttachmentHeader({
  onSelectOption,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: "#ddd",
      }}
    >
      <HeaderButton
        icon="camera"
        label="Camera"
        color="#F97316"
        onPress={() => onSelectOption("camera")}
      />

      <HeaderButton
        icon="images"
        label="Gallery"
        color="#3B82F6"
        onPress={() => onSelectOption("gallery")}
      />

      <HeaderButton
        icon="document"
        label="Document"
        color="#8B5CF6"
        onPress={() => onSelectOption("document")}
      />

      <HeaderButton
        icon="videocam"
        label="Video"
        color="#EF4444"
        onPress={() => onSelectOption("video")}
      />
    </View>
  );
}

interface ButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

function HeaderButton({
  icon,
  label,
  color,
  onPress,
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={{ alignItems: "center" }}
      onPress={onPress}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: color,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons
          name={icon}
          size={24}
          color="white"
        />
      </View>

      <AppText
        style={{
          marginTop: 8,
          fontSize: 12,
        }}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}
