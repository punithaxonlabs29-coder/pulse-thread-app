import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
// @ts-ignore
import * as MediaLibrary from 'expo-media-library';
import { styles } from './DownloadButton.styles';
import { ConnectsService } from '../../services/connects.service';
import { CONFIG } from '../../constants/config';

interface DownloadButtonProps {
  url: string;
  filename: string;
  messageId?: string;   // ← used to fetch real binary via server API
  style?: any;
}

/** Determine if this URL / filename represents a video */
function detectIsVideo(url: string, filename: string): boolean {
  const lower = (url + ' ' + filename).toLowerCase();
  return (
    lower.includes('.mp4') || lower.includes('.mov') || lower.includes('.mkv') ||
    lower.includes('.webm') || lower.includes('.3gp') || lower.includes('video') ||
    lower.startsWith('data:video')
  );
}

/** Always build a local path with an explicit .mp4 or .jpg extension */
function buildLocalPath(filename: string, isVideo: boolean): string {
  let safe = (filename || 'media').replace(/[^a-zA-Z0-9._-]/g, '_');
  const dotIndex = safe.lastIndexOf('.');
  const base = dotIndex > 0 ? safe.substring(0, dotIndex) : safe;
  return FileSystem.documentDirectory + base + (isVideo ? '.mp4' : '.jpg');
}

/** Is this URI one we can actually read? content://media/... is a hidden Android API */
function isAccessibleUri(uri: string): boolean {
  if (uri.startsWith('http://') || uri.startsWith('https://')) return true;
  if (uri.startsWith('file://')) return true;
  if (uri.startsWith('data:')) return true;
  // content://media/external/... is the sender's local MediaStore — NOT readable on receiver
  return false;
}

export default function DownloadButton({ url, filename, messageId, style }: DownloadButtonProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  const rawString = typeof url === 'string' ? url : String(url || '');
  const isVideo = detectIsVideo(rawString, filename || '');
  const localUri = buildLocalPath(filename || 'media', isVideo);

  // Check if already downloaded
  useEffect(() => {
    let active = true;
    FileSystem.getInfoAsync(localUri)
      .then(info => { if (active && info.exists && info.size > 0) setStatus('success'); })
      .catch(() => {});
    return () => { active = false; };
  }, [localUri]);

  // ─── Save a confirmed local file:// path to gallery ───────────────────────
  const saveToGallery = async (localFilePath: string): Promise<void> => {
    // Validate file is real and non-empty
    try {
      const info = await FileSystem.getInfoAsync(localFilePath);
      if (!info.exists || info.size === 0) {
        Alert.alert('Download Failed', 'The file could not be saved (empty or missing).');
        setStatus('error');
        return;
      }
    } catch (_) {}

    // Permission
    const perm = await MediaLibrary.getPermissionsAsync(false);
    if (!perm.granted) {
      const req = await MediaLibrary.requestPermissionsAsync(false);
      if (!req.granted) {
        Alert.alert('Permission Denied', 'Storage permission is required to save files.');
        return;
      }
    }

    // localFilePath already ends with .mp4 / .jpg from buildLocalPath — pass directly
    try {
      const asset = await MediaLibrary.createAssetAsync(localFilePath);
      try { await MediaLibrary.createAlbumAsync('Pulse', asset, false); } catch (_) {}
      Alert.alert('Saved!', `${isVideo ? 'Video' : 'Image'} saved to Gallery in "Pulse" album.`);
    } catch (err) {
      console.log('MediaLibrary save error:', err);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localFilePath);
      }
    }
  };

  // ─── Resolve the real downloadable URL ────────────────────────────────────
  // Strategy 1: Use rawString if it's directly accessible (http/https/file/data)
  // Strategy 2: Fetch attachment metadata from server, find accessible URL in any field
  // Strategy 3: Download binary directly from the attachment API endpoint itself
  const resolveDownloadUrl = async (): Promise<string | 'USE_ATTACHMENT_API' | null> => {
    if (isAccessibleUri(rawString)) return rawString;

    if (!messageId) return null;

    // Strategy 2: Fetch attachment metadata and look for any accessible URL field
    try {
      const attachments = await ConnectsService.getMessageAttachment(messageId);
      console.log('Attachment response for', messageId, JSON.stringify(attachments));
      if (attachments && attachments.length > 0) {
        const att = attachments.find((a: any) => a.name === filename) || attachments[0];
        // Check every possible URL field the server might return
        const candidates = [
          att?.url, att?.file_url, att?.uri, att?.download_url,
          att?.media_url, att?.src, att?.path, att?.source
        ].filter(Boolean);

        for (const candidate of candidates) {
          if (candidate && isAccessibleUri(candidate)) return candidate;
        }
      }
    } catch (_) {}

    // Strategy 3: The attachment API endpoint itself may serve the binary
    // when called with proper auth headers — let downloadAttachmentBinary handle it
    return 'USE_ATTACHMENT_API';
  };

  // ─── Main download handler ─────────────────────────────────────────────────
  const handleDownload = async () => {
    // Delete any stale zero-byte or error-cached file at localUri first
    try {
      const info = await FileSystem.getInfoAsync(localUri);
      if (info.exists && info.size < 1024) {
        await FileSystem.deleteAsync(localUri, { idempotent: true });
        setStatus('idle');
      }
    } catch (_) {}

    if (status === 'success') {
      const info = await FileSystem.getInfoAsync(localUri).catch(() => null);
      if (info && info.exists && info.size > 1024) {
        await saveToGallery(localUri);
        return;
      }
      // Stale or missing — reset status and re-download
      setStatus('idle');
    }

    setStatus('downloading');
    setProgress(0);

    try {
      // ── Case 1: Base64 data URI ─────────────────────────────────────────
      if (rawString.startsWith('data:')) {
        const base64 = rawString.split(',')[1];
        if (!base64) throw new Error('Empty base64');
        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setProgress(100);
        setStatus('success');
        await saveToGallery(localUri);
        return;
      }

      // ── Case 2: Resolve the actual downloadable URL ─────────────────────
      setProgress(10);
      const downloadUrl = await resolveDownloadUrl();

      if (!downloadUrl) {
        throw new Error('Could not resolve a downloadable URL for this attachment.');
      }

      // ── Case 3: USE_ATTACHMENT_API — download binary directly from the
      //    /connects/message/attachment/ endpoint using session cookies ───────
      if (downloadUrl === 'USE_ATTACHMENT_API' && messageId) {
        const apiUrl = `${CONFIG.API_BASE_URL}connects/message/attachment/?message_id=${messageId}`;
        console.log('Attempting direct binary download from attachment API:', apiUrl);
        const ok = await ConnectsService.downloadAttachmentBinary(apiUrl, localUri);
        if (!ok) {
          // Server only has JSON metadata — video was never uploaded (size: 0)
          setStatus('error');
          Alert.alert(
            'Video Not Available',
            'This video was sent from a gallery shortcut and was not fully uploaded to the server. The sender needs to resend it.'
          );
          return;
        }
        setProgress(100);
        setStatus('success');
        await saveToGallery(localUri);
        return;
      }

      // ── Case 4: local file:// — copy to named path ──────────────────────
      if (downloadUrl.startsWith('file://')) {
        await FileSystem.copyAsync({ from: downloadUrl, to: localUri });
        setProgress(100);
        setStatus('success');
        await saveToGallery(localUri);
        return;
      }

      // ── Case 5: HTTP/HTTPS — authenticated download with session cookie ──
      if (downloadUrl.startsWith('http://') || downloadUrl.startsWith('https://')) {
        const ok = await ConnectsService.downloadAttachmentBinary(downloadUrl, localUri);
        if (!ok) throw new Error('Authenticated download failed');
        setProgress(100);
        setStatus('success');
        await saveToGallery(localUri);
        return;
      }

      throw new Error(`Unsupported URL: ${downloadUrl}`);

    } catch (err) {
      console.log('Download error:', err);
      setStatus('error');
      Alert.alert('Download Failed', 'Could not download this file. Please try again.');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handleDownload}
      disabled={status === 'downloading'}
      activeOpacity={0.7}
    >
      {status === 'idle' || status === 'error' ? (
        <MaterialIcons name="file-download" size={18} color="#FFFFFF" />
      ) : status === 'success' ? (
        <MaterialIcons name="check-circle" size={18} color="#22C55E" />
      ) : (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#F97316" />
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
