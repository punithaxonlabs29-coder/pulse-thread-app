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
import * as VideoThumbnails from "expo-video-thumbnails";

const SCREEN_W = Dimensions.get("window").width;
const ITEM_SIZE = (SCREEN_W - 10) / 4;

interface Props {
  selectedAssets: MediaLibrary.Asset[];
  onToggleSelectAsset: (asset: MediaLibrary.Asset) => void;
}

function GalleryItemImage({ uri, isSelected }: { uri: string; isSelected: boolean }) {
  const [thumbUri, setThumbUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    VideoThumbnails.getThumbnailAsync(uri, { time: 1000, quality: 0.4 })
      .then(res => { if (active && res.uri) setThumbUri(res.uri); })
      .catch(() => {});
    return () => { active = false; };
  }, [uri]);

  return (
    <Image
      source={{ uri: thumbUri || uri }}
      style={[styles.image, isSelected && styles.imageSelected]}
    />
  );
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

      // Load both photos AND videos
      const result = await MediaLibrary.getAssetsAsync({
        first: 300,
        mediaType: ['photo', 'video'],
        sortBy: [["creationTime", false]],
      });

      setPhotos(result.assets);
    } catch (e) {
      console.log(e);
    }

    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
        const isVideo = item.mediaType === 'video';

        return (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onToggleSelectAsset(item)}
            style={styles.itemContainer}
          >
            {isVideo ? (
              <GalleryItemImage uri={item.uri} isSelected={isSelected} />
            ) : (
              <Image
                source={{ uri: item.uri }}
                style={[
                  styles.image,
                  isSelected && styles.imageSelected,
                ]}
              />
            )}

            {/* Video duration badge */}
            {isVideo && (
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>
                  {item.duration ? formatDuration(item.duration) : '▶'}
                </Text>
              </View>
            )}

            {/* Selection overlay border */}
            {isSelected && <View style={styles.overlay} />}

            {/* Selection circle number */}
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
  videoBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "600",
  },
});
