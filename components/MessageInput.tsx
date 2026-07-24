import React, { useState } from "react";
import { TextInput, TouchableOpacity, View, Text, Image , Keyboard, ScrollView, Platform } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import AttachmentPreview, { PendingAttachment } from './AttachmentPreview';
import AttachmentSheet from './AttachmentSheet/AttachmentSheet';
import AudioRecorder, { AudioRecordingResult } from './AudioRecorder';
import EmojiKeyboard from './EmojiKeyboard';
import ImagePreviewScreen from './ImageEditor/ImagePreviewScreen';
import DealInputModal from './DealInputModal';
import CameraOptionModal from './CameraOptionModal';
import { Audio } from 'expo-av';

import { Message } from '../types/connects';
import { createStyles } from './MessageInput.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';


export interface MentionMember {
  name: string;
  email?: string;
  role?: string;
}

const DEFAULT_MEMBERS: MentionMember[] = [
  { name: "CEO", email: "ceo@company.com", role: "CEO" },
  { name: "Manager", email: "manager@company.com", role: "Manager" },
  { name: "Sales Rep", email: "sales@company.com", role: "Sales Rep" },
  { name: "Karan", email: "karan@company.com", role: "Sales Rep" },
  { name: "Sunil Pal", email: "sunil@company.com", role: "Lead Contact" },
  { name: "Rajit Kumar", email: "rajit@company.com", role: "Sales Rep" },
  { name: "Sowndarya HS", email: "sowndarya@company.com", role: "Lead Contact" },
];

interface MessageInputProps {
  onSend: (text: string, attachments?: PendingAttachment[], dealInput?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  members?: MentionMember[];
  isDealChat?: boolean;
}

export default function MessageInput({ onSend, onTyping, replyingTo, onCancelReply, members, isDealChat = false }: MessageInputProps) {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [selectedDealInput, setSelectedDealInput] = useState<string | null>(null);
  const [showDealInputModal, setShowDealInputModal] = useState(false);
  const [showCameraOptionModal, setShowCameraOptionModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showEmojiKeyboard, setShowEmojiKeyboard] = useState(false);
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [previewImages, setPreviewImages] = useState<PendingAttachment[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = React.useRef<TextInput>(null);
  const isSendingRef = React.useRef(false);

  const availableMembers = members !== undefined ? members : DEFAULT_MEMBERS;
  const filteredMembers = availableMembers.filter(m => 
    (m.name && m.name.toLowerCase().includes(mentionQuery)) || 
    (m.email && m.email.toLowerCase().includes(mentionQuery))
  );

  const handleTextChange = (newText: string) => {
    setText(newText);
    
    // Check if typing @mention
    const lastAtIndex = newText.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const queryAfterAt = newText.slice(lastAtIndex + 1);
      if (!queryAfterAt.includes('\n') && !queryAfterAt.includes('  ')) {
        setMentionQuery(queryAfterAt.toLowerCase());
        setMentionStartIndex(lastAtIndex);
        setShowMentionPopover(true);
      } else {
        setShowMentionPopover(false);
      }
    } else {
      setShowMentionPopover(false);
    }

    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const selectMention = (memberName: string) => {
    if (mentionStartIndex !== -1) {
      const beforeAt = text.slice(0, mentionStartIndex);
      const newText = `${beforeAt}@${memberName} `;
      setText(newText);
    }
    setShowMentionPopover(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSend = () => {
    if (isSendingRef.current) return;
    if (!text.trim() && attachments.length === 0 && !selectedDealInput) return;
    
    isSendingRef.current = true;
    onSend(text, attachments, selectedDealInput || undefined);
    setText("");
    setAttachments([]);
    setSelectedDealInput(null);
    
    if (onTyping) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
    
    setTimeout(() => {
      isSendingRef.current = false;
    }, 500);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const addAttachment = (att: PendingAttachment) => {
    setAttachments(prev => [...prev, att]);
  };

  const handleMenuSelect = async (option: string) => {
    setMenuVisible(false);
    if (option === 'deal_inputs') {
      setTimeout(() => {
        setShowDealInputModal(true);
      }, 250);
      return;
    }
    try {
      if (option === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
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
      } else if (option === 'camera_video' || option === 'explain_clip') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraStatus !== 'granted') return;
        try {
          await Audio.requestPermissionsAsync();
        } catch (e) {
          console.log("Audio permission request error:", e);
        }

        if (Platform.OS === 'android') {
          try {
            const intentResult = await IntentLauncher.startActivityAsync(
              'android.media.action.VIDEO_CAPTURE'
            );
            if (intentResult.resultCode === -1 && intentResult.data) {
              addAttachment({
                uri: intentResult.data,
                type: 'video/mp4',
                name: `video_${Date.now()}.mp4`,
                mimeType: 'video/mp4'
              });
              return;
            } else if (intentResult.resultCode === 0) {
              // User cancelled recording
              return;
            }
          } catch (intentErr) {
            console.log("IntentLauncher video capture failed, falling back to launchCameraAsync:", intentErr);
          }
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['videos'],
          allowsEditing: false,
          videoMaxDuration: 60,
        });
        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          addAttachment({
            uri: asset.uri,
            type: asset.mimeType || 'video/mp4',
            name: asset.fileName || `video_${Date.now()}.mp4`,
            size: asset.fileSize,
            mimeType: asset.mimeType || 'video/mp4'
          });
        }
      } else if (option === 'gallery') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
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
          mediaTypes: ['videos'],
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
      } else if (option === 'audio') {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'audio/*',
          copyToCacheDirectory: true,
          multiple: true,
        });
        if (!result.canceled && result.assets) {
          result.assets.forEach(asset => {
            addAttachment({
              uri: asset.uri,
              type: asset.mimeType || 'audio/mpeg',
              name: asset.name || `audio_${Date.now()}.mp3`,
              size: asset.size,
              mimeType: asset.mimeType || 'audio/mpeg'
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

  const handleAudioRecord = (result: AudioRecordingResult) => {
    onSend("", [{
      uri: result.uri,
      type: result.mimeType || 'audio/m4a',
      name: `audio_${Date.now()}.m4a`,
      size: result.size,
      mimeType: result.mimeType || 'audio/m4a'
    }]);
  };

  return (
    <View style={styles.container}>
      {replyingTo && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewLeftBar} />
          <View style={styles.replyPreviewContent}>
            <AppText variant="bodySemibold" style={styles.replyPreviewName}>{replyingTo.sender_name || "Unknown"}</AppText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {replyingTo.attachments?.[0]?.type?.startsWith('image/') && (
                <Ionicons name="image" size={12} color={colors.text.muted} style={{ marginRight: 4 }} />
              )}
              <AppText variant="caption" style={styles.replyPreviewText} numberOfLines={1}>
                {replyingTo.text || (replyingTo.attachments?.[0]?.type?.startsWith('image/') ? 'Photo' : 'Attachment')}
              </AppText>
            </View>
          </View>
          {(() => {
            const isPhoto = replyingTo.attachments?.[0]?.type?.startsWith('image/');
            const url = replyingTo.attachments?.[0]?.url || replyingTo.attachments?.[0]?.file_url;
            if (isPhoto && url) {
              return <Image source={{ uri: url }} style={styles.replyPreviewThumbnail} />;
            }
            return null;
          })()}
          <TouchableOpacity style={styles.replyPreviewClose} onPress={onCancelReply}>
            <Ionicons name="close-circle" size={20} color={colors.text.muted} />
          </TouchableOpacity>
        </View>
      )}

      <AttachmentPreview attachments={attachments} onRemove={handleRemoveAttachment} />
      
      {showMentionPopover && filteredMembers.length > 0 && (
        <View style={styles.mentionPopoverContainer}>
          <ScrollView keyboardShouldPersistTaps="always" style={{ maxHeight: 160 }}>
            {filteredMembers.map((member) => (
              <TouchableOpacity
                key={member.name}
                style={styles.mentionItem}
                onPress={() => selectMention(member.name)}
              >
                <View style={styles.mentionAvatar}>
                  <AppText style={styles.mentionAvatarText}>
                    {member.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemibold" style={{ color: colors.text.primary }}>
                    {member.name}
                  </AppText>
                  {member.role ? (
                    <AppText variant="caption" style={{ color: colors.text.muted }}>
                      {member.role} {member.email ? `• ${member.email}` : ''}
                    </AppText>
                  ) : (
                    member.email && (
                      <AppText variant="caption" style={{ color: colors.text.muted }}>
                        {member.email}
                      </AppText>
                    )
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedDealInput && (
        <View style={styles.dealInputTagContainer}>
          <AppText style={styles.dealInputTagText}>{selectedDealInput}</AppText>
          <TouchableOpacity onPress={() => setSelectedDealInput(null)} style={styles.dealInputTagClose} hitSlop={10}>
            <Ionicons name="close" size={18} color="#059669" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          {!isRecording && (
            <TouchableOpacity 
              style={styles.iconButtonInside} 
              onPress={() => {
                if (showEmojiKeyboard) {
                  setShowEmojiKeyboard(false);
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 50);
                } else {
                  setShowEmojiKeyboard(true);
                  Keyboard.dismiss();
                }
              }}
            >
              {showEmojiKeyboard ? (
                <MaterialIcons name="keyboard" size={24} color={colors.text.muted} />
              ) : (
                <Ionicons name="happy-outline" size={24} color={colors.text.muted} />
              )}
            </TouchableOpacity>
          )}

          {!isRecording && (
            <TextInput
              ref={inputRef}
              autoFocus={true}
              cursorColor={colors.brand.primary}
              selectionColor="rgba(249, 115, 22, 0.3)"
              caretHidden={false}
              showSoftInputOnFocus={!showEmojiKeyboard}
              placeholder={selectedDealInput ? "Write it here..." : "Type a message..."}
              placeholderTextColor={colors.text.muted}
              style={styles.input}
              value={text}
              onChangeText={handleTextChange}
              onFocus={() => {
                setShowEmojiKeyboard(false);
              }}
              multiline
            />
          )}

          {!isRecording && (
            <TouchableOpacity 
              style={styles.iconButtonInside}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <Ionicons name="attach-outline" size={24} color={colors.text.muted} />
            </TouchableOpacity>
          )}

          {!isRecording && !text.trim() && (
            <TouchableOpacity 
              style={styles.iconButtonInside}
              onPress={() => setShowCameraOptionModal(true)}
            >
              <Ionicons name="camera-outline" size={24} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {text.trim() || attachments.length > 0 ? (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons name="send" size={18} color={colors.text.inverse} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        ) : (
          <AudioRecorder onRecordComplete={handleAudioRecord} onRecordingStateChange={setIsRecording} />
        )}
      </View>

      <AttachmentSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onSelectOption={handleMenuSelect}
        isDealChat={isDealChat}
        onSendMediaBatch={(attachments, captionText) => {
          setMenuVisible(false);
          onSend(captionText?.trim() || "", attachments);
        }}
        onEditMediaBatch={(attachments, captionText) => {
          setMenuVisible(false);
          setPreviewImages(attachments);
          setShowPreview(true);
        }}
      />

      <ImagePreviewScreen
        visible={showPreview}
        images={previewImages}
        onClose={() => setShowPreview(false)}
        onSend={(imgs, caption) => {
          setShowPreview(false);
          const captionText = caption.trim();
          onSend(captionText, imgs);
          setPreviewImages([]);
        }}
      />

      <DealInputModal
        visible={showDealInputModal}
        onClose={() => setShowDealInputModal(false)}
        onSelectOption={(option) => {
          setSelectedDealInput(option);
          setShowDealInputModal(false);
        }}
      />

      <CameraOptionModal
        visible={showCameraOptionModal}
        onClose={() => setShowCameraOptionModal(false)}
        onSelectPhoto={() => handleMenuSelect('camera')}
        onSelectVideo={() => handleMenuSelect('camera_video')}
      />

      {showEmojiKeyboard && (
        <EmojiKeyboard 
          onEmojiSelected={(emoji) => handleTextChange(text + emoji)} 
          onBackspace={() => {
            if (text.length > 0) {
              const arr = Array.from(text);
              arr.pop();
              handleTextChange(arr.join(''));
            }
          }}
        />
      )}
    </View>
  );
}

