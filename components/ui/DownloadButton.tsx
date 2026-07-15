import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// @ts-ignore
import * as MediaLibrary from 'expo-media-library';
import { styles } from './DownloadButton.styles';

interface DownloadButtonProps {
  url: string;
  filename: string;
  style?: any;
}

export default function DownloadButton({ url, filename, style }: DownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  // Derive a safe local path and ensure an extension exists for MediaLibrary
  let safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  if (!safeFilename.includes('.')) {
    // Attempt to guess extension from URL or fallback to jpg
    if (url.includes('.mp4') || url.startsWith('data:video')) {
      safeFilename += '.mp4';
    } else {
      safeFilename += '.jpg'; // default to jpg for media library
    }
  }
  const localUri = FileSystem.documentDirectory + safeFilename;

  // Check if file already exists
  useEffect(() => {
    let isMounted = true;
    const checkExisting = async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        if (fileInfo.exists) {
          if (isMounted) setStatus('success');
        }
      } catch (err) {
        // ignore
      }
    };
    checkExisting();
    return () => { isMounted = false; };
  }, [localUri]);

  const handleSaveToLibrary = async (fileUri: string) => {
    try {
      const existingPerms = await MediaLibrary.getPermissionsAsync();
      if (existingPerms.status !== 'granted') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'We need storage permission to save the file.');
          return;
        }
      }
      
      const ext = safeFilename.split('.').pop()?.toLowerCase() || '';
      const isMedia = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'].includes(ext);

      if (isMedia) {
        try {
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('Pulse', asset, false);
          Alert.alert('Success', 'Saved to Gallery (Pulse album)!');
        } catch (mediaErr) {
          console.log('MediaLibrary save error:', mediaErr);
          // Fallback to simple save
          await MediaLibrary.saveToLibraryAsync(fileUri);
          Alert.alert('Success', 'Saved to Gallery!');
        }
      } else {
        // Fallback to sharing for non-media files (PDF, DOCX) as MediaLibrary only supports images/videos
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        }
      }
    } catch (e) {
      console.log('Error saving to library:', e);
      Alert.alert('Error', 'Failed to save file.');
    }
  };

  const handleDownload = async () => {
    if (status === 'success') {
      // If already downloaded, just save/share it
      await handleSaveToLibrary(localUri);
      return;
    }

    try {
      setStatus('downloading');
      setProgress(0);

      if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1];
        if (base64Data) {
          setProgress(50);
          await FileSystem.writeAsStringAsync(localUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          setProgress(100);
          setStatus('success');
          await handleSaveToLibrary(localUri);
        } else {
          setStatus('error');
        }
        return;
      }

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
        {},
        (downloadProgress) => {
          const progressPercent = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          setProgress(Math.round(progressPercent));
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        setStatus('success');
        await handleSaveToLibrary(result.uri);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.log('Download error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') return null;

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handleDownload}
      disabled={status === 'downloading'}
      activeOpacity={0.7}
    >
      {status === 'idle' || status === 'error' ? (
        <MaterialIcons name="file-download" size={28} color="#FFFFFF" />
      ) : status === 'downloading' ? (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#F97316" />
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
