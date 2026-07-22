import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import * as MediaLibrary from "expo-media-library";
import { PendingAttachment } from "../AttachmentPreview";

interface Props {
  onImageSelected: (attachment: PendingAttachment) => void;
}

export default function RecentGallery({
  onImageSelected,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);

  useEffect(() => {
    loadRecentPhotos();
  }, []);

  const loadRecentPhotos = async () => {
    try {
      const permission =
        await MediaLibrary.requestPermissionsAsync();

      if (!permission.granted) {
        setLoading(false);
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 200,
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
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <FlashList
      data={photos}
      estimatedItemSize={90}
      numColumns={4}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            onImageSelected({
              uri: item.uri,
              type: "image/jpeg",
              mimeType: "image/jpeg",
              name: item.filename || `photo_${Date.now()}.jpg`,
            });
          }}
        >
          <Image
            source={{ uri: item.uri }}
            style={{
              width: 90,
              height: 90,
              margin: 2,
            }}
          />
        </TouchableOpacity>
      )}
    />
  );
}
