import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Image,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import * as MediaLibrary from "expo-media-library";

const SCREEN_W = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_W - 10) / 4;

interface Props {
  selectedAssets: MediaLibrary.Asset[];
  onToggleSelectAsset: (asset: MediaLibrary.Asset) => void;
}

export default function RecentGallery({
  selectedAssets,
  onToggleSelectAsset,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    loadRecentPhotos();
  }, []);

  const loadRecentPhotos = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        setLoading(false);
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 300,
        mediaType: "photo",
        sortBy: [["creationTime", false]],
      });

      setPhotos(result.assets);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} color="#F97316" />;
  }

  return (
    <FlashList
      data={photos}
      estimatedItemSize={ITEM_SIZE}
      numColumns={4}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const selectIndex = selectedAssets.findIndex((a) => a.id === item.id);
        const isSelected = selectIndex !== -1;

        return (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onToggleSelectAsset(item)}
            style={styles.itemContainer}
          >
            <Image
              source={{ uri: item.uri }}
              style={[
                styles.image,
                isSelected && styles.imageSelected,
              ]}
            />

            {/* Selection overlay border */}
            {isSelected && <View style={styles.overlay} />}

            {/* WhatsApp Green Selection Circle Number */}
            <View
              style={[
                styles.badge,
                isSelected ? styles.badgeSelected : styles.badgeUnselected,
              ]}
            >
              {isSelected && (
                <Text style={styles.badgeText}>{selectIndex + 1}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageSelected: {
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    borderColor: "#F97316",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeUnselected: {
    borderWidth: 1.5,
    borderColor: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  badgeSelected: {
    backgroundColor: "#F97316",
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
});
