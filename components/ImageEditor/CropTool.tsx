import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
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
  onCancel: () => void;
}

type CropRatio = "free" | "1:1" | "4:5" | "16:9" | "original";

const CROP_RATIOS: { label: string; value: CropRatio }[] = [
  { label: "Free",     value: "free"     },
  { label: "1:1",      value: "1:1"      },
  { label: "4:5",      value: "4:5"      },
  { label: "16:9",     value: "16:9"     },
  { label: "Original", value: "original" },
];

export default function CropTool({ imageUri, onDone, onCancel }: Props) {
  const [selectedRatio, setSelectedRatio] = useState<CropRatio>("free");
  const [processing, setProcessing] = useState(false);

  const getImageDimensions = (): { width: number; height: number } => {
    switch (selectedRatio) {
      case "1:1":   return { width: 1080, height: 1080 };
      case "4:5":   return { width: 1080, height: 1350 };
      case "16:9":  return { width: 1920, height: 1080 };
      default:      return { width: 1080, height: 1080 };
    }
  };

  const applyCrop = async () => {
    if (selectedRatio === "free" || selectedRatio === "original") {
      onDone(imageUri);
      return;
    }

    setProcessing(true);
    try {
      const dims = getImageDimensions();
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: dims }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      onDone(result.uri);
    } catch (e) {
      Alert.alert("Error", "Could not apply crop. Please try again.");
      console.log(e);
    }
    setProcessing(false);
  };

  const previewSize = (() => {
    switch (selectedRatio) {
      case "1:1":  return { width: SCREEN_W - 40, height: SCREEN_W - 40 };
      case "4:5":  return { width: SCREEN_W - 80, height: (SCREEN_W - 80) * (5 / 4) };
      case "16:9": return { width: SCREEN_W - 40, height: (SCREEN_W - 40) * (9 / 16) };
      default:     return { width: SCREEN_W - 40, height: SCREEN_W - 40 };
    }
  })();

  return (
    <View style={styles.container}>
      {/* Image preview with crop frame */}
      <View style={styles.imageArea}>
        <View style={[styles.cropFrame, previewSize]}>
          <Image
            source={{ uri: imageUri }}
            style={[styles.previewImage, previewSize]}
            resizeMode="cover"
          />
          {/* Corner handles */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Ratio selector */}
      <View style={styles.ratioRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratioScroll}>
          {CROP_RATIOS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.ratioBtn, selectedRatio === r.value && styles.ratioBtnActive]}
              onPress={() => setSelectedRatio(r.value)}
            >
              <Text style={[styles.ratioLabel, selectedRatio === r.value && styles.ratioLabelActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Apply button */}
      <TouchableOpacity
        style={styles.applyBtn}
        onPress={applyCrop}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.applyText}>Apply Crop</Text>
          </>
        )}
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
  cropFrame: {
    position: "relative",
    overflow: "hidden",
  },
  previewImage: {
    borderRadius: 2,
  },
  // Corner handles
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#F97316",
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

  // Ratio row
  ratioRow: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  ratioScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  ratioBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
  },
  ratioBtnActive: {
    backgroundColor: "#F97316",
  },
  ratioLabel: {
    color: "#aaa",
    fontSize: 13,
    fontWeight: "600",
  },
  ratioLabelActive: {
    color: "#fff",
  },

  // Apply button
  applyBtn: {
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
  applyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
