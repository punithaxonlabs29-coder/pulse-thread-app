import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";

const SCREEN_W = Dimensions.get("window").width;

interface Props {
  imageUri: string;
  onDone: (newUri: string) => void;
}

type RotateAction = "rotate90" | "flipH" | "flipV";

const ROTATE_ACTIONS: { label: string; icon: string; action: RotateAction }[] = [
  { label: "Rotate 90°",       icon: "refresh-outline",        action: "rotate90" },
  { label: "Flip Horizontal",  icon: "swap-horizontal-outline", action: "flipH"   },
  { label: "Flip Vertical",    icon: "swap-vertical-outline",   action: "flipV"   },
];

export default function RotateTool({ imageUri, onDone }: Props) {
  const [currentUri, setCurrentUri] = useState(imageUri);
  const [processing, setProcessing] = useState(false);

  const applyTransform = async (action: RotateAction) => {
    setProcessing(true);
    try {
      let actions: ImageManipulator.Action[] = [];

      if (action === "rotate90") {
        actions = [{ rotate: 90 }];
      } else if (action === "flipH") {
        actions = [{ flip: ImageManipulator.FlipType.Horizontal }];
      } else if (action === "flipV") {
        actions = [{ flip: ImageManipulator.FlipType.Vertical }];
      }

      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        actions,
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCurrentUri(result.uri);
    } catch (e) {
      Alert.alert("Error", "Could not apply transform.");
      console.log(e);
    }
    setProcessing(false);
  };

  return (
    <View style={styles.container}>
      {/* Live preview */}
      <View style={styles.imageArea}>
        {processing ? (
          <ActivityIndicator size="large" color="#F97316" />
        ) : (
          <Image
            source={{ uri: currentUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Transform buttons */}
      <View style={styles.actions}>
        {ROTATE_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.action}
            style={styles.actionBtn}
            onPress={() => applyTransform(a.action)}
            disabled={processing}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon as any} size={26} color="#F97316" />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Done */}
      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => onDone(currentUri)}
        disabled={processing}
      >
        <Ionicons name="checkmark" size={20} color="#fff" />
        <Text style={styles.doneText}>Apply Changes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  imageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  previewImage: {
    width: SCREEN_W - 40,
    height: SCREEN_W - 40,
    borderRadius: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#1a1a1a",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  actionBtn: {
    alignItems: "center",
    gap: 6,
  },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(249,115,22,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F97316",
  },
  actionLabel: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  doneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
