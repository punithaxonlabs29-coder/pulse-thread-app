import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AttachmentPreview, { PendingAttachment } from './AttachmentPreview';
import AttachmentMenu from './AttachmentMenu';
import AudioRecorder from './AudioRecorder';

interface MessageInputProps {
  onSend: (text: string, attachments?: PendingAttachment[]) => void;
}

export default function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;
    onSend(text, attachments);
    setText("");
    setAttachments([]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addAttachment = (att: PendingAttachment) => {
    setAttachments(prev => [...prev, att]);
  };

  const handleMenuSelect = async (option: 'camera' | 'gallery' | 'document' | 'video') => {
    try {
      if (option === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          addAttachment({
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || `camera_${Date.now()}.jpg`,
            size: asset.fileSize,
            mimeType: asset.mimeType
          });
        }
      } else if (option === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          allowsMultipleSelection: true,
        });
        if (!result.canceled && result.assets) {
          result.assets.forEach(asset => {
            addAttachment({
              uri: asset.uri,
              type: asset.mimeType || 'image/jpeg',
              name: asset.fileName || `gallery_${Date.now()}.jpg`,
              size: asset.fileSize,
              mimeType: asset.mimeType
            });
          });
        }
      } else if (option === 'video') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.7,
          allowsMultipleSelection: true,
        });
        if (!result.canceled && result.assets) {
          result.assets.forEach(asset => {
            addAttachment({
              uri: asset.uri,
              type: asset.mimeType || 'video/mp4',
              name: asset.fileName || `video_${Date.now()}.mp4`,
              size: asset.fileSize,
              mimeType: asset.mimeType
            });
          });
        }
      } else if (option === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          copyToCacheDirectory: true,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          addAttachment({
            uri: asset.uri,
            type: asset.mimeType || 'application/octet-stream',
            name: asset.name,
            size: asset.size,
            mimeType: asset.mimeType
          });
        }
      }
    } catch (e) {
      console.log('Attachment error', e);
    }
  };

  const handleAudioRecord = (uri: string, durationMillis: number) => {
    addAttachment({
      uri,
      type: 'audio/m4a',
      name: `audio_${Date.now()}.m4a`,
    });
  };

  return (
    <View style={styles.wrapper}>
      <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />
      
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="happy-outline" size={24} color="#6B7280" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="attach-outline" size={24} color="#6B7280" />
        </TouchableOpacity>

        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={text}
          onChangeText={setText}
          multiline
        />

        {text.trim().length === 0 && attachments.length === 0 ? (
          <AudioRecorder onRecordComplete={handleAudioRecord} />
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        )}
      </View>

      <AttachmentMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onSelectOption={handleMenuSelect} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  iconButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 16,
    color: "#111827",
  },
  sendButton: {
    backgroundColor: "#2563EB",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 4,
  },
});
